import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DingTalkApi implements ICredentialType {
	name = 'dingTalkApi';
	displayName = 'DingTalk API';
	documentationUrl = 'https://github.com/xsdlr/n8n-nodes-dingtalk-stream';

	properties: INodeProperties[] = [
		{
			displayName: 'DingTalkClientId',
			name: 'clientId',
			type: 'string',
			default: '',
		},
		{
			displayName: 'DingTalkClientSecret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];
}
