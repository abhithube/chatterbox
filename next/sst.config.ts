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
    new sst.aws.SnsTopic('SnsTopic', {
      fifo: true,
      transform: {
        topic: {
          contentBasedDeduplication: true,
        },
      },
    })

    new sst.aws.Nextjs('ChatterboxNext')
  },
})
