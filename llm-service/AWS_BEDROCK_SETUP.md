# AWS Bedrock Setup Guide for LLM Service

This guide explains how to configure the LLM service to use AWS Bedrock for accessing various Large Language Models, including OpenAI OSS models.

## Prerequisites

1. **AWS Account**: You need an active AWS account with Bedrock access enabled
2. **AWS Credentials**: Either IAM user credentials or IAM role with appropriate permissions
3. **Python Dependencies**: Install required packages

## Step 1: Enable AWS Bedrock in Your AWS Account

1. Log in to AWS Console
2. Navigate to Amazon Bedrock service
3. Go to "Model access" in the left sidebar
4. Request access to the models you want to use:
   - Claude models (Anthropic)
   - Llama models (Meta)
   - Mistral models
   - Titan models (Amazon)
   - And others available in your region

## Step 2: Set Up AWS Credentials

### Option A: Using Environment Variables (Recommended for Development)

```bash
export AWS_ACCESS_KEY_ID=your_access_key_here
export AWS_SECRET_ACCESS_KEY=your_secret_key_here
export AWS_REGION=us-east-1
```

### Option B: Using AWS CLI Configuration

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
```

### Option C: Using IAM Role (Recommended for Production)

If running on EC2, ECS, or Lambda, assign an IAM role with Bedrock permissions.

## Step 3: Configure IAM Permissions

Create or update an IAM policy with the following permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream",
                "bedrock:ListFoundationModels",
                "bedrock:GetFoundationModel"
            ],
            "Resource": "*"
        }
    ]
}
```

## Step 4: Install Python Dependencies

```bash
cd llm-service
pip install -r requirements.txt
```

The requirements include:
- `boto3`: AWS SDK for Python
- `langchain-aws`: LangChain AWS integration
- Other necessary dependencies

## Step 5: Configure the LLM Service

1. Copy the example configuration:
```bash
cp .env.bedrock.example .env
```

2. Edit `.env` file with your configuration:

```env
# Set API type to bedrock
LLM_API_TYPE=bedrock

# AWS Configuration
AWS_REGION=us-east-1

# Optional: Explicit credentials (if not using AWS CLI or IAM role)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Choose your model
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
```

## Available Models on Bedrock

### Claude Models (Anthropic)
- `anthropic.claude-3-sonnet-20240229-v1:0` - Balanced performance
- `anthropic.claude-3-haiku-20240307-v1:0` - Fast and cost-effective
- `anthropic.claude-instant-v1` - Previous generation, fast

### Llama Models (Meta)
- `meta.llama2-13b-chat-v1` - Llama 2 13B
- `meta.llama2-70b-chat-v1` - Llama 2 70B
- `meta.llama3-8b-instruct-v1:0` - Llama 3 8B
- `meta.llama3-70b-instruct-v1:0` - Llama 3 70B

### Mistral Models
- `mistral.mistral-7b-instruct-v0:2` - Mistral 7B
- `mistral.mixtral-8x7b-instruct-v0:1` - Mixtral 8x7B

### Amazon Titan Models
- `amazon.titan-text-express-v1` - Fast text generation
- `amazon.titan-text-lite-v1` - Lightweight model

## Step 6: Test the Configuration

1. Start the LLM service:
```bash
cd llm-service
python app.py
```

2. Test with a sample request:
```bash
curl -X POST http://localhost:8001/api/search/parse \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Find parking near me under $10",
    "userLocation": {"lat": 25.0330, "lng": 121.5654}
  }'
```

## Using Custom or Fine-tuned Models

If you have deployed custom models or fine-tuned versions on Bedrock:

1. Get the model ARN or endpoint from AWS Bedrock console
2. Update the `BEDROCK_MODEL_ID` in your `.env` file:
```env
BEDROCK_MODEL_ID=arn:aws:bedrock:us-east-1:123456789012:custom-model/your-model-id
```

## Troubleshooting

### Common Issues

1. **"Access Denied" Error**
   - Ensure your IAM user/role has the necessary Bedrock permissions
   - Check if the model is enabled in your AWS account

2. **"Model not found" Error**
   - Verify the model ID is correct
   - Check if the model is available in your selected region
   - Ensure you have requested and been granted access to the model

3. **"Invalid credentials" Error**
   - Verify AWS credentials are correctly configured
   - Check if credentials have expired (for temporary credentials)

4. **Region Issues**
   - Not all models are available in all regions
   - Check AWS documentation for model availability by region

### Debug Mode

Enable debug logging to see detailed information:

```env
DEBUG=true
LOG_LEVEL=DEBUG
```

## Cost Considerations

- AWS Bedrock charges per token processed
- Different models have different pricing
- Monitor usage in AWS Cost Explorer
- Consider using smaller models for development/testing

## Security Best Practices

1. **Never commit credentials to version control**
   - Use `.env` files (add to `.gitignore`)
   - Use AWS Secrets Manager for production

2. **Use IAM roles in production**
   - Avoid hardcoding credentials
   - Use temporary credentials when possible

3. **Implement rate limiting**
   - Protect against excessive API calls
   - Monitor and alert on unusual usage patterns

4. **Enable AWS CloudTrail**
   - Track all Bedrock API calls
   - Useful for auditing and debugging

## Additional Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [LangChain AWS Integration](https://python.langchain.com/docs/integrations/platforms/aws)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [Model Cards and Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/models.html)

## Support

For issues specific to this implementation, check the logs in the `llm-service` directory or enable debug mode for more detailed error messages.
