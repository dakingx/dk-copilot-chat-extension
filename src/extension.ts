import * as vscode from 'vscode'

const BASE_PROMPT =
	'You are a helpful code tutor. Your job is to teach the user with simple descriptions and sample code of the concept. Respond with a guided overview of the concept in a series of messages. Do not give the user the answer directly, but guide them to find the answer themselves. If the user asks a non-programming question, politely decline to respond.'

export function activate(context: vscode.ExtensionContext) {
	const handler: vscode.ChatRequestHandler = async (
		request: vscode.ChatRequest,
		context: vscode.ChatContext,
		stream: vscode.ChatResponseStream,
		token: vscode.CancellationToken,
	) => {
		const messages = [
			vscode.LanguageModelChatMessage.User(BASE_PROMPT),
			vscode.LanguageModelChatMessage.User(request.prompt),
		]

		const response = await request.model.sendRequest(messages, {}, token)

		for await (const chunk of response.text) {
			stream.markdown(chunk)
		}

		return
	}

	const chatParticipant = vscode.chat.createChatParticipant('dk-tech.dk-chat', handler)
	chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'tutor.jpeg')
}

export function deactivate() { }
