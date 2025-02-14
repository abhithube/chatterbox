ARG TARGET="x86_64-unknown-linux-musl"

FROM rust:1.84-alpine AS base
WORKDIR /app
ARG TARGET
RUN apk add --no-cache musl-dev
RUN rustup target add $TARGET
RUN rustup default nightly
RUN cargo install cargo-chef

FROM base AS prepare
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM base AS build
COPY --from=prepare /app/recipe.json recipe.json
RUN cargo chef cook --target $TARGET --release --recipe-path recipe.json
COPY . .
RUN cargo build --target $TARGET --release

FROM gcr.io/distroless/static AS release
ARG TARGET
EXPOSE 80
COPY --from=build /app/target/$TARGET/release/chatterbox-messages /
ENTRYPOINT ["/chatterbox-messages"]