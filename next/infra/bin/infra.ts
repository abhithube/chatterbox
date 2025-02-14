#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { ChatterboxAppStack } from '../lib'

const app = new cdk.App()
new ChatterboxAppStack(app, 'ChatterboxAppStack')
