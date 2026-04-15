import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

async function createCognitoUser() {
  try {
    const command = new AdminCreateUserCommand({
      UserPoolId: 'us-east-1_fQl9BKSxq',
      Username: 'inversioneszonaruedas@gmail.com',
      UserAttributes: [
        { Name: 'email', Value: 'inversioneszonaruedas@gmail.com' },
        { Name: 'custom:tenant_id', Value: 'afc1f24c-669e-4424-944f-0e56820b07b3' },
        { Name: 'custom:role', Value: 'admin' }
      ],
      TemporaryPassword: '8ojjff8oA1!'
    });
    
    const result = await client.send(command);
    console.log('✅ User created:', result.User.Username);
    
    const pwCommand = new AdminSetUserPasswordCommand({
      UserPoolId: 'us-east-1_fQl9BKSxq',
      Username: 'inversioneszonaruedas@gmail.com',
      Password: '8ojjff8oA1!',
      Permanent: true
    });
    
    await client.send(pwCommand);
    console.log('✅ Password set to permanent');
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createCognitoUser();