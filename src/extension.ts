import * as vscode from 'vscode'

const BASE_PROMPT =
	'You are a helpful code tutor. Your job is to teach the user with simple descriptions and sample code of the concept. Respond with a guided overview of the concept in a series of messages. Do not give the user the answer directly, but guide them to find the answer themselves. If the user asks a non-programming question, try to answer using prompt context or politely decline to respond.'

const EXERCISES_PROMPT =
	'You are a helpful tutor. Your job is to teach the user with fun, simple exercises that they can complete in the editor. Your exercises should start simple and get more complex as the user progresses. Move one concept at a time, and do not move on to the next concept until the user provides the correct answer. Give hints in your exercises to help the user learn. If the user is stuck, you can provide the answer and explain why it is the answer. If the user asks a non-programming question, politely decline to respond.'

export function activate(context: vscode.ExtensionContext) {
	const handler: vscode.ChatRequestHandler = async (
		request: vscode.ChatRequest,
		context: vscode.ChatContext,
		stream: vscode.ChatResponseStream,
		token: vscode.CancellationToken,
	) => {
		let rolePrompt = BASE_PROMPT
		if (request.command === 'exercise') {
			rolePrompt = EXERCISES_PROMPT
		}
		console.log('Role Prompt:', rolePrompt)

		const messages = [vscode.LanguageModelChatMessage.User(rolePrompt)]

		// Message history
		console.log('Context History:', context.history)
		context.history.filter((chatTurn) => {
			if (chatTurn instanceof vscode.ChatRequestTurn) {
				console.log('Request Turn Prompt:', chatTurn.prompt)
				messages.push(vscode.LanguageModelChatMessage.User(chatTurn.prompt))
			} else if (chatTurn instanceof vscode.ChatResponseTurn) {
				const fullMessage = chatTurn.response.filter(chatResponse => chatResponse instanceof vscode.ChatResponseMarkdownPart)
					.map((markdownPart) => markdownPart.value.value)
					.join('')
				console.log('Response Turn Full Message:', fullMessage)
				messages.push(vscode.LanguageModelChatMessage.Assistant(fullMessage))
			}
		})

		messages.push(vscode.LanguageModelChatMessage.User(request.prompt))

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
