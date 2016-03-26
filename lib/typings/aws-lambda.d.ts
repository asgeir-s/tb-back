export interface Context {
  /**
   * You should call this method when your job become done.
   *
   * @param error provides results of the failed Lambda function execution.
   * @param result provides the result of a successful function execution. 
   * The result provided must be JSON.stringify compatible. If an error is 
   * provided, this parameter is expected to be null.
   */
  done(error?: any, result?: any): void

  /**
   * Indicates the Lambda function execution and all callbacks completed successfully.
   *
   * @param result is optional parameter and it can be used to provide the result of 
   * the function execution. Must be JSON.stringify compatible.
   */
  succeed(result?: any): void

  /**
   * Indicates the Lambda function execution and all callbacks completed unsuccessfully, 
   * resulting in a handled exception. If the error value is non-null, the method will 
   * set the response body to the string representation of error and also write corresponding 
   * logs to CloudWatch. 
   *
   * @param error is the optional parameter that you can use to provide the result of the Lambda function execution.
   */
  fail(error?: any): void

  /**
   * Returns the approximate remaining execution time (before timeout occurs) of the Lambda function 
   * that is currently executing.
   */
  getRemainingTimeInMillis(): number

  /**
   * Name of the Lambda function that is executing.
   */
  functionName: string

  /**
   * The Lambda function version that is executing. If an alias is used to invoke the function, then 
   * function_version will be the version the alias points to.
   */
  functionVersion: string

  /**
   * The ARN used to invoke this function. It can be function ARN or alias ARN. An unqualified ARN 
   * executes the $LATEST version and aliases execute the function version it is pointing to.
   */
  invokedFunctionArn: string

  /**
   * Memory limit, in MB, you configured for the Lambda function. You set the memory limit at the 
   * time you create a Lambda function and you can change it later.
   */
  memoryLimitInMB: number

  /**
   * AWS request ID associated with the request. This is the ID returned to the client that called 
   * the invoke method.
   * 
   * NOTE: 
   * If AWS Lambda retries the invocation (for example, in a situation where the Lambda function 
   * that is processing Amazon Kinesis records throws an exception), the request ID remains the same.
   */
  awsRequestId: string

  /**
   * The name of the CloudWatch log group where you can find logs written by your Lambda function.
   */
  logGroupName: string

  /**
   * The name of the CloudWatch log group where you can find logs written by your Lambda function. 
   * The log stream may or may not change for each invocation of the Lambda function.
   * 
   * The value is null if your Lambda function is unable to create a log stream, which can happen 
   * if the execution role that grants necessary permissions to the Lambda function does not include 
   * permissions for the CloudWatch actions.
   */
  logStreamName: string

  /**
   * Information about the Amazon Cognito identity provider when invoked through the AWS Mobile SDK. It can be null.
   */
  identity: CognitoIdentity

  /**
   * Information about the client application and device when invoked through the AWS Mobile SDK.
   */
  clientContext: ClientContext
}

interface ClientContext {
  client: ClientContextClient
  /**
   * Custom values set by the mobile client application.
   */
  Custom: string
  env: ClientContextEnv
}

interface ClientContextEnv {
  platform_version: string
  platform: string
  make: string
  model: string
  locale: string
}

interface ClientContextClient {
  installation_id: string
  app_title: string
  app_version_name: string
  app_version_code: string
  app_package_name: string
}


interface CognitoIdentity {
  cognito_identity_id: string
  cognito_identity_pool_id: string
}
