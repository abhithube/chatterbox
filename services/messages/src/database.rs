use aws_sdk_dynamodb::{types::AttributeValue, Client};

#[derive(Debug, Clone)]
pub struct Database {
    client: Client,
    table_name: String,
}

impl Database {
    pub fn new(client: Client, table_name: String) -> Self {
        Self { client, table_name }
    }

    pub async fn is_member(
        &self,
        party_id: &str,
        user_id: &str,
    ) -> Result<bool, aws_sdk_dynamodb::Error> {
        let output = self
            .client
            .get_item()
            .table_name(&self.table_name)
            .key("pk", AttributeValue::S(format!("PARTY#{}", party_id)))
            .key("sk", AttributeValue::S(format!("MEMBER#{}", user_id)))
            .send()
            .await?;

        Ok(output.item.is_some())
    }

    pub async fn topic_exists(
        &self,
        party_id: &str,
        topic_id: &str,
    ) -> Result<bool, aws_sdk_dynamodb::Error> {
        let output = self
            .client
            .get_item()
            .table_name(&self.table_name)
            .key("pk", AttributeValue::S(format!("PARTY#{}", party_id)))
            .key("sk", AttributeValue::S(format!("TOPIC#{}", topic_id)))
            .send()
            .await?;

        Ok(output.item.is_some())
    }
}
