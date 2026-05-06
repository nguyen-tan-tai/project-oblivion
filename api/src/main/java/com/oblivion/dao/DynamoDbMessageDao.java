package com.oblivion.dao;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import org.eclipse.microprofile.config.ConfigProvider;

import com.oblivion.entity.MessageRecord;

import jakarta.enterprise.context.ApplicationScoped;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.DeleteItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ReturnValue;

@ApplicationScoped
public class DynamoDbMessageDao implements MessageDao {

    private static final String DEFAULT_DYNAMODB_ENDPOINT = "http://localhost:8000";
    private static final String DEFAULT_DYNAMODB_REGION = "us-east-1";
    private static final String DEFAULT_TABLE_NAME = "oblivion_messages";

    @Override
    public void saveMessage(MessageRecord messageRecord) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("messageId", AttributeValue.builder().s(messageRecord.messageId()).build());
        item.put("message", AttributeValue.builder().s(messageRecord.message()).build());
        item.put("createdAt", AttributeValue.builder().n(Long.toString(messageRecord.createdAt())).build());

        if (messageRecord.expireTime() != null) {
            long expireEpochSeconds = messageRecord.expireTime() / 1000;
            item.put("expireTime", AttributeValue.builder().n(Long.toString(expireEpochSeconds)).build());
        }

        try (DynamoDbClient dynamoDbClient = createDynamoDbClient()) {
            dynamoDbClient.putItem(PutItemRequest.builder()
                    .tableName(tableName())
                    .item(item)
                    .build());
        }
    }

    @Override
    public MessageRecord retrieveAndForgetMessage(String messageId) {
        Map<String, AttributeValue> key = Map.of(
                "messageId", AttributeValue.builder().s(messageId).build());

        try (DynamoDbClient dynamoDbClient = createDynamoDbClient()) {
            Map<String, AttributeValue> deletedItem = dynamoDbClient.deleteItem(DeleteItemRequest.builder()
                            .tableName(tableName())
                            .key(key)
                            .returnValues(ReturnValue.ALL_OLD)
                            .build())
                    .attributes();

            if (deletedItem == null || deletedItem.isEmpty()) {
                return null;
            }

            return new MessageRecord(
                    asString(deletedItem.get("messageId")),
                    asString(deletedItem.get("message")),
                    asEpochMillis(deletedItem.get("expireTime")),
                    asLong(deletedItem.get("createdAt"), 0L));
        }
    }

    private DynamoDbClient createDynamoDbClient() {
        return DynamoDbClient.builder()
                .endpointOverride(URI.create(dynamoDbEndpoint()))
                .region(Region.of(dynamoDbRegion()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create("dummy", "dummy")))
                .build();
    }

    private String dynamoDbEndpoint() {
        return ConfigProvider.getConfig()
                .getOptionalValue("oblivion.dynamodb.endpoint", String.class)
                .orElse(DEFAULT_DYNAMODB_ENDPOINT);
    }

    private String dynamoDbRegion() {
        return ConfigProvider.getConfig()
                .getOptionalValue("oblivion.dynamodb.region", String.class)
                .orElse(DEFAULT_DYNAMODB_REGION);
    }

    private String tableName() {
        return ConfigProvider.getConfig()
                .getOptionalValue("oblivion.dynamodb.table-name", String.class)
                .orElse(DEFAULT_TABLE_NAME);
    }

    private String asString(AttributeValue attributeValue) {
        return attributeValue == null ? null : attributeValue.s();
    }

    private Long asEpochMillis(AttributeValue attributeValue) {
        if (attributeValue == null || attributeValue.n() == null) {
            return null;
        }

        return Long.parseLong(attributeValue.n()) * 1000;
    }

    private long asLong(AttributeValue attributeValue, long defaultValue) {
        if (attributeValue == null || attributeValue.n() == null) {
            return defaultValue;
        }

        return Long.parseLong(attributeValue.n());
    }
}