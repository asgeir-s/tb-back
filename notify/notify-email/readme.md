# setup
manualy adda SNS subscription to this function (to add permissions for SNS to execute this function)

##Add function envoke from SNS permission [must be done when a new function is added]
    aws lambda add-permission \
    --region us-east-1 \
    --function-name tbLambdaBackend-email \
    --statement-id 4 \
    --principal sns.amazonaws.com \
    --action lambda:InvokeFunction \
    --qualifier prod