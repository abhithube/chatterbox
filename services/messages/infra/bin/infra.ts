#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { ChatterboxMessagesStack } from '../lib'

const app = new cdk.App()
new ChatterboxMessagesStack(app, 'ChatterboxMessagesStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
})
