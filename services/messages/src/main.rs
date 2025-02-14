use std::{env, sync::Arc};

use anyhow::anyhow;
use axum::{
    http::{header, HeaderValue, Method},
    routing, Router,
};
use chrono::{DateTime, Utc};
use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use socketioxide::{
    extract::{AckSender, Data, Extension, MaybeExtension, SocketRef, State},
    handler::ConnectHandler,
    SocketIo,
};
use tokio::net::TcpListener;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing::debug;

const BASE_PATH: &str = "/api/v1";

#[derive(Clone)]
struct SocketState {
    pub decoding_key: DecodingKey,
    pub validation: Validation,
}

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct Claims {
    pub sub: String,
    pub name: String,
    pub image: Option<String>,
}

#[derive(Debug, Clone)]
struct SocketUser {
    pub id: String,
    pub name: String,
    pub image: Option<String>,
}

#[derive(Debug, Clone)]
struct SocketParty {
    pub id: String,
}

#[derive(Debug, Clone)]
struct SocketTopic {
    pub id: String,
}

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct IncomingMessage {
    pub id: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct Message {
    pub id: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub author: Author,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct Author {
    pub id: String,
    pub name: String,
    pub image: Option<String>,
}

fn auth_middleware(
    socket: SocketRef,
    State(state): State<Arc<SocketState>>,
) -> Result<(), anyhow::Error> {
    let bearer = socket
        .req_parts()
        .headers
        .get("Authorization")
        .ok_or_else(|| anyhow!("'Authorization' header not found"))?
        .to_str()?
        .split_whitespace()
        .next_back()
        .ok_or_else(|| anyhow!("Invalid format for 'Authorization' header"))?;

    let token = jsonwebtoken::decode::<Claims>(bearer, &state.decoding_key, &state.validation)?;

    socket.extensions.insert(SocketUser {
        id: token.claims.sub,
        name: token.claims.name,
        image: token.claims.image,
    });

    Ok(())
}

fn on_connect(socket: SocketRef, Extension(_user): Extension<SocketUser>) {
    socket.on("party:join", on_party_join);
    socket.on("topic:join", on_topic_join);
    socket.on("message:create", on_message_create);
}

async fn on_party_join(
    io: SocketIo,
    socket: SocketRef,
    Extension(user): Extension<SocketUser>,
    MaybeExtension(party): MaybeExtension<SocketParty>,
    Data(party_id): Data<String>,
    ack: AckSender,
) {
    if let Some(party) = party {
        socket.leave(format!("party:{}", party.id));
    }

    let room = format!("party:{}", party_id);
    socket.join(room.clone());

    debug!("user {} joined party {}", user.id, party_id);

    socket.extensions.insert(SocketParty {
        id: party_id.clone(),
    });

    ack.send(&party_id).unwrap();

    let users = io
        .to(room.clone())
        .sockets()
        .into_iter()
        .filter_map(|e| e.extensions.get::<SocketUser>().map(|e| e.id))
        .collect::<Vec<_>>();

    io.to(room).emit("user:online", &users).await.unwrap();
}

async fn on_topic_join(
    socket: SocketRef,
    Extension(user): Extension<SocketUser>,
    Extension(_party): Extension<SocketParty>,
    MaybeExtension(topic): MaybeExtension<SocketTopic>,
    Data(topic_id): Data<String>,
    ack: AckSender,
) {
    if let Some(topic) = topic {
        socket.leave(format!("topic:{}", topic.id));
    }

    socket.join(format!("topic:{}", topic_id));

    debug!("user {} joined topic {}", user.id, topic_id);

    socket.extensions.insert(SocketTopic {
        id: topic_id.clone(),
    });

    ack.send(&topic_id).unwrap()
}

async fn on_message_create(
    io: SocketIo,
    Extension(user): Extension<SocketUser>,
    Extension(topic): Extension<SocketTopic>,
    Data(data): Data<IncomingMessage>,
) {
    let message = Message {
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        author: Author {
            id: user.id,
            name: user.name,
            image: user.image,
        },
    };

    debug!(
        r#"user {} sending message "{}" to topic {}"#,
        message.author.id, message.content, topic.id
    );

    io.to(format!("topic:{}", topic.id))
        .emit("message:created", &message)
        .await
        .unwrap();
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let pem_public_key = env::var("PEM_PUBLIC_KEY")?;
    let port = env::var("PORT")
        .ok()
        .and_then(|e| e.parse().ok())
        .unwrap_or(80);
    let cors_origins_raw = env::var("CORS_ORIGINS").map(Some).unwrap_or_default();

    let (socketio_layer, io) = SocketIo::builder()
        .with_state(Arc::new(SocketState {
            decoding_key: DecodingKey::from_rsa_pem(pem_public_key.as_bytes())?,
            validation: Validation::new(Algorithm::RS256),
        }))
        .req_path(format!("{}/socket.io", BASE_PATH))
        .build_layer();

    io.ns("/", on_connect.with(auth_middleware));

    let mut app = Router::new()
        .nest(
            BASE_PATH,
            Router::new().route("/health", routing::get(|| async { "OK" })),
        )
        .layer(TraceLayer::new_for_http())
        .layer(socketio_layer);

    if let Some(cors_origins_raw) = cors_origins_raw {
        let cors_origins = cors_origins_raw
            .split(",")
            .filter_map(|e| e.parse::<HeaderValue>().ok())
            .collect::<Vec<_>>();

        app = app.layer(
            CorsLayer::new()
                .allow_methods(Method::GET)
                .allow_headers([header::AUTHORIZATION])
                .allow_origin(cors_origins),
        )
    }

    let listener = TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
