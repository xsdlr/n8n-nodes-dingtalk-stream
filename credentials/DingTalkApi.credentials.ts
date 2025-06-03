import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DingTalkApi implements ICredentialType {
	name = 'dingTalkApi';
	displayName = 'DingTalk Api';

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
