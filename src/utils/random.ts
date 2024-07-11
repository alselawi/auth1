export function randomCode(length: number = 6) {
	return Array.from({ length: 30 }, () => String.fromCharCode(Math.floor(Math.random() * 36) + 65))
		.join('')
		.replace(/[^a-z]/gi, '')
		.substring(0, length)
		.toUpperCase();
}