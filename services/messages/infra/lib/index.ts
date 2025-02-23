import * as cdk from 'aws-cdk-lib'
import * as appscaling from 'aws-cdk-lib/aws-applicationautoscaling'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecr from 'aws-cdk-lib/aws-ecr'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'
import 'dotenv/config'

export class ChatterboxMessagesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
      isDefault: true,
    })

    const queue = new sqs.Queue(this, 'Queue', {
      fifo: true,
      contentBasedDeduplication: true,
    })

    const usersTopic = sns.Topic.fromTopicArn(
      this,
      'UsersTopic',
      process.env.USERS_TOPIC_ARN!,
    )
    const partiesTopic = sns.Topic.fromTopicArn(
      this,
      'PartiesTopic',
      process.env.PARTIES_TOPIC_ARN!,
    )

    usersTopic.addSubscription(new sns_subscriptions.SqsSubscription(queue))
    partiesTopic.addSubscription(new sns_subscriptions.SqsSubscription(queue))

    const table = new dynamodb.TableV2(this, 'Table', {
      partitionKey: {
        name: 'pk',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: dynamodb.AttributeType.STRING,
      },
    })

    const repository = new ecr.Repository(this, 'Repository', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    })

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: 'api.chatterbox.abhithube.com',
      validation: acm.CertificateValidation.fromDns(),
    })

    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        'FargateService',
        {
          vpc,
          taskImageOptions: {
            image: ecs.ContainerImage.fromEcrRepository(repository),
            environment: {
              CORS_ORIGINS: process.env.CORS_ORIGINS!,
              PEM_PUBLIC_KEY: process.env.PEM_PUBLIC_KEY!,
              AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
              AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
              TABLE_NAME: table.tableArn,
              QUEUE_URL: queue.queueUrl,
            },
          },
          certificate,
          assignPublicIp: true,
        },
      )
    fargateService.targetGroup.configureHealthCheck({
      path: '/api/v1/health',
    })

    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 2,
    })

    scaling.scaleOnCpuUtilization('CpuUtilization', {
      targetUtilizationPercent: 50,
    })
    scaling.scaleOnMemoryUtilization('MemoryUtilization', {
      targetUtilizationPercent: 50,
    })

    scaling.scaleOnSchedule('MorningSchedule', {
      schedule: appscaling.Schedule.cron({ hour: '16', minute: '0' }),
      minCapacity: 1,
      maxCapacity: 2,
    })
    scaling.scaleOnSchedule('EveningSchedule', {
      schedule: appscaling.Schedule.cron({ hour: '4', minute: '0' }),
      minCapacity: 0,
      maxCapacity: 0,
    })
  }
}
