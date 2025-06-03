import type {
	INodeType,
	INodeTypeDescription,
	ITriggerFunctions,
	ITriggerResponse,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { DWClient, RobotMessage, TOPIC_ROBOT } from 'dingtalk-stream';

interface DingTalkCredentials {
	clientId: string;
	clientSecret: string;
}

export class DingTalkStreamTriggerNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DingTalkStreamTriggerNode',
		name: 'dingTalkStreamTriggerNode',
		icon: 'file:dingtalk.svg',
		group: ['trigger'],
		version: 1,
		description: '钉钉流式触发节点',
		defaults: {
			name: '钉钉流式触发节点',
		},
		inputs: [],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'isAutoResponse',
				name: 'isAutoResponse',
				type: 'boolean',
				default: true,
				placeholder: '',
				description: '是否自动响应（避免服务端重试）',
			},
		],
		credentials: [
			{
				name: 'dingTalkApi',
				required: true,
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse | undefined> {
		let client: DWClient | null = null;
		const isAutoResponse = this.getNodeParameter('isAutoResponse') as boolean;
		const credentials = (await this.getCredentials('dingTalkApi')) as DingTalkCredentials;
		const { clientId, clientSecret } = credentials || {};

		client = new DWClient({ clientId, clientSecret });
		client
			.registerCallbackListener(TOPIC_ROBOT, async (res) => {
				const message = JSON.parse(res.data) as RobotMessage;
				const messageId = res.headers.messageId;
				const accessToken = await client?.getAccessToken();

				if (isAutoResponse) {
					client?.socketCallBackResponse(messageId, {});
				}
				this.emit([
					this.helpers.returnJsonArray([
						{
							accessToken,
							messageId,
							message,
						},
					]),
				]);
			})
			.connect();

		return {
			closeFunction: async () => {
				client?.disconnect();
				client = null;
			},
		};
	}
}
