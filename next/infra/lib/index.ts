import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as sns from 'aws-cdk-lib/aws-sns'

export class ChatterboxAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    new sns.Topic(this, 'UsersTopic', {
      fifo: true,
      contentBasedDeduplication: true,
    })

    new sns.Topic(this, 'PartiesTopic', {
      fifo: true,
      contentBasedDeduplication: true,
    })
  }
}
