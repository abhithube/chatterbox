import { PublishCommand, SNSClient } from '@aws-sdk/client-sns'

const snsClient = new SNSClient()

export type UserCreated = {
  id: string
  email: string
  name: string
  image: string | null
}

export async function publishUserCreated(data: UserCreated) {
  await snsClient.send(
    new PublishCommand({
      Message: JSON.stringify({
        type: 'user:created',
        data,
      }),
      TopicArn: process.env.USERS_TOPIC_ARN,
      MessageGroupId: data.id,
    }),
  )
}

export type PartyCreated = {
  id: string
  title: string
}

export async function publishPartyCreated(data: PartyCreated) {
  await snsClient.send(
    new PublishCommand({
      Message: JSON.stringify({
        type: 'party:created',
        data,
      }),
      TopicArn: process.env.PARTIES_TOPIC_ARN,
      MessageGroupId: data.id,
    }),
  )
}

export type PartyUpdated = {
  id: string
  title?: string
}

export async function publishPartyUpdated(data: PartyUpdated) {
  await snsClient.send(
    new PublishCommand({
      Message: JSON.stringify({
        type: 'party:updated',
        data,
      }),
      TopicArn: process.env.PARTIES_TOPIC_ARN,
      MessageGroupId: data.id,
    }),
  )
}

export type PartyDeleted = {
  id: string
}

export async function publishPartyDeleted(data: PartyDeleted) {
  await snsClient.send(
    new PublishCommand({
      Message: JSON.stringify({
        type: 'party:deleted',
        data,
      }),
      TopicArn: process.env.PARTIES_TOPIC_ARN,
      MessageGroupId: data.id,
    }),
  )
}

export type MemberCreated = {
  partyId: string
  userId: string
  isAdmin: boolean
}

export async function publishMemberCreated(data: MemberCreated) {
  await snsClient.send(
    new PublishCommand({
      Message: JSON.stringify({
        type: 'member:created',
        data,
      }),
      TopicArn: process.env.PARTIES_TOPIC_ARN,
      MessageGroupId: data.partyId,
    }),
  )
}

export type MemberDeleted = {
  partyId: string
  userId: string
}

export async function publishMemberDeleted(data: MemberDeleted) {
  await snsClient.send(
    new PublishCommand({
      Message: JSON.stringify({
        type: 'member:deleted',
        data,
      }),
      TopicArn: process.env.PARTIES_TOPIC_ARN,
      MessageGroupId: data.partyId,
    }),
  )
}

export type TopicCreated = {
  id: string
  title: string
  partyId: string
}

export async function publishTopicCreated(data: TopicCreated) {
  await snsClient.send(
    new PublishCommand({
      Message: JSON.stringify({
        type: 'topic:created',
        data,
      }),
      TopicArn: process.env.PARTIES_TOPIC_ARN,
      MessageGroupId: data.partyId,
    }),
  )
}

export type TopicUpdated = {
  id: string
  title?: string
  partyId: string
}

export async function publishTopicUpdated(data: TopicUpdated) {
  await snsClient.send(
    new PublishCommand({
      Message: JSON.stringify({
        type: 'topic:updated',
        data,
      }),
      TopicArn: process.env.PARTIES_TOPIC_ARN,
      MessageGroupId: data.partyId,
    }),
  )
}

export type TopicDeleted = {
  id: string
  partyId: string
}

export async function publishTopicDeleted(data: TopicDeleted) {
  await snsClient.send(
    new PublishCommand({
      Message: JSON.stringify({
        type: 'topic:deleted',
        data,
      }),
      TopicArn: process.env.PARTIES_TOPIC_ARN,
      MessageGroupId: data.partyId,
    }),
  )
}
