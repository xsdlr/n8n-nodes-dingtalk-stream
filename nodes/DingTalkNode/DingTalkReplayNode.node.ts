import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeExecutionWithMetadata,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

interface MessageResponse {
	at: {
		atUserIds: string[];
		isAtAll: boolean;
	};
	text?: {
		content: string;
	};
	markdown?: {
		title: string;
		text: string;
	};
	msgtype?: string;
}

// 钉钉机器人消息类型
const MSG_TYPE = {
	TEXT: 'text',
	MARKDOWN: 'markdown',
} as const;

export class DingTalkReplayNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DingTalkReplayNode',
		name: 'dingTalkReplayNode',
		icon: 'file:dingtalk.svg',
		group: ['input'],
		version: 1,
		description: '钉钉回复节点',
		defaults: {
			name: '钉钉回复节点',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		properties: [
			{
				displayName: 'webhook',
				name: 'webhook',
				type: 'string',
				default: '',
				required: true,
				placeholder: '',
				description: '钉钉机器人webhook',
			},
			{
				displayName: 'accessToken',
				name: 'accessToken',
				type: 'string',
				default: '',
				required: true,
				placeholder: '',
				description: '钉钉机器人accessToken',
			},
			{
				displayName: '是否使用JSON格式数据模式',
				name: 'enableJsonMode',
				type: 'boolean',
				default: false,
				required: true,
				placeholder: 'JSON格式数据模式下自行构建数据结构',
			},
			{
				displayName: '数据内容',
				name: 'jsonData',
				type: 'json',
				default: {},
				required: false,
				displayOptions: {
					show: {
						enableJsonMode: [true],
					},
				},
			},
			{
				displayName: '是否@所有人',
				name: 'isAtAll',
				type: 'boolean',
				default: false,
				placeholder: '',
				displayOptions: {
					show: {
						enableJsonMode: [false],
						msgtype: ['text', 'markdown'],
					},
				},
			},
			{
				displayName: '被@人的用户Userid',
				name: 'atUserIds',
				type: 'string',
				default: '',
				description: '被@人的用户userid，多个用,隔开',
				displayOptions: {
					show: {
						enableJsonMode: [false],
						msgtype: ['text', 'markdown'],
						isAtAll: [false],
					},
				},
			},
			{
				displayName: '消息类型',
				name: 'msgtype',
				type: 'options',
				required: true,
				default: 'text',
				options: [
					{
						name: 'Markdown类型',
						value: MSG_TYPE.MARKDOWN,
					},
					{
						name: 'Text类型',
						value: MSG_TYPE.TEXT,
					},
				],
				displayOptions: {
					show: {
						enableJsonMode: [false],
					},
				},
			},
			{
				displayName: '消息内容',
				name: 'content',
				type: 'string',
				default: '',
				required: true,
				placeholder: '',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						enableJsonMode: [false],
						msgtype: [MSG_TYPE.TEXT],
					},
				},
			},
			{
				displayName: '消息标题',
				name: 'title',
				type: 'string',
				default: '',
				required: true,
				description: '首屏会话透出的展示内容',
				displayOptions: {
					show: {
						enableJsonMode: [false],
						msgtype: [MSG_TYPE.MARKDOWN],
					},
				},
			},
			{
				displayName: 'Markdown格式的消息',
				name: 'markdownText',
				type: 'string',
				default: '',
				required: true,
				placeholder: '',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						enableJsonMode: [false],
						msgtype: [MSG_TYPE.MARKDOWN],
					},
				},
			},
		],
		credentials: [],
	};

	async execute(
		this: IExecuteFunctions,
	): Promise<INodeExecutionData[][] | NodeExecutionWithMetadata[][] | null> {
		const webhook = this.getNodeParameter('webhook', 0) as string;
		const accessToken = this.getNodeParameter('accessToken', 0) as string;
		const enableJsonMode = this.getNodeParameter('enableJsonMode', 0) as boolean;

		const isAtAll = enableJsonMode ? false : (this.getNodeParameter('isAtAll', 0) as boolean);
		const atUserIds =
			!enableJsonMode && !isAtAll
				? (this.getNodeParameter('atUserIds', 0) as string)?.split?.(',') || []
				: [];
		const msgtype = enableJsonMode ? undefined : (this.getNodeParameter('msgtype', 0) as string);

		let replayMsgRes: MessageResponse = {
			at: {
				atUserIds,
				isAtAll,
			},
		};

		if (enableJsonMode) {
			const jsonData = (this.getNodeParameter('jsonData', 0) as MessageResponse) || {};
			replayMsgRes = {
				...replayMsgRes,
				...jsonData,
			};
		} else if (msgtype === MSG_TYPE.TEXT) {
			const content = this.getNodeParameter('content', 0) as string;
			replayMsgRes = {
				...replayMsgRes,
				msgtype,
				text: {
					content,
				},
			};
		} else if (msgtype === MSG_TYPE.MARKDOWN) {
			const title = this.getNodeParameter('title', 0) as string;
			const markdownText = this.getNodeParameter('markdownText', 0) as string;
			replayMsgRes = {
				...replayMsgRes,
				msgtype,
				markdown: {
					title,
					text: markdownText,
				},
			};
		}

		if (!replayMsgRes.msgtype) {
			throw new NodeOperationError(this.getNode(), 'msgtype为空');
		}

		const result = await this.helpers.request(webhook, {
			method: 'POST',
			json: true,
			body: replayMsgRes,
			headers: {
				'Content-Type': 'application/json',
				'x-acs-dingtalk-access-token': accessToken,
			},
		});

		return this.prepareOutputData([
			{
				json: result,
			},
		]);
	}
}
