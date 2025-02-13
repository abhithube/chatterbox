// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'Chatterbox',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
    }
  },
  async run() {
    const dynamoTable = new sst.aws.Dynamo('DynamoTable', {
      fields: {
        pk: 'string',
        sk: 'string',
        GSI1PK: 'string',
        GSI1SK: 'string',
      },
      primaryIndex: {
        hashKey: 'pk',
        rangeKey: 'sk',
      },
      globalIndexes: {
        GSI1: {
          hashKey: 'GSI1PK',
          rangeKey: 'GSI1SK',
          projection: 'all',
        },
      },
      ttl: 'expires',
    })

    new sst.aws.SnsTopic('SnsTopic', {
      fifo: true,
      transform: {
        topic: {
          contentBasedDeduplication: true,
        },
      },
    })

    new sst.aws.Nextjs('ChatterboxNext', {
      link: [dynamoTable],
    })
  },
})
