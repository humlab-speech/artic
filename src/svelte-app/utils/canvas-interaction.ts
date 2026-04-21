export function hasAudioBuffer(audioBuffer: { length?: number } | null | undefined): boolean {
	return !!audioBuffer && typeof audioBuffer.length === 'number' && audioBuffer.length > 0;
}

function getScaledCanvasCoordinate(
	event: MouseEvent | TouchEvent,
	axis: 'x' | 'y'
): number {
	const target = event.target as HTMLCanvasElement | null;
	if (!target) return 0;

	const rect = target.getBoundingClientRect();
	let raw = 0;

	if ('touches' in event && event.touches.length > 0) {
		raw = axis === 'x'
			? event.touches[0].clientX - rect.left
			: event.touches[0].clientY - rect.top;
	} else if ('changedTouches' in event && event.changedTouches.length > 0) {
		raw = axis === 'x'
			? event.changedTouches[0].clientX - rect.left
			: event.changedTouches[0].clientY - rect.top;
	} else if (axis === 'x') {
		raw = typeof (event as MouseEvent).offsetX === 'number'
			? (event as MouseEvent).offsetX
			: (event as MouseEvent).clientX - rect.left;
	} else {
		raw = typeof (event as MouseEvent).offsetY === 'number'
			? (event as MouseEvent).offsetY
			: (event as MouseEvent).clientY - rect.top;
	}

	const clientSize = axis === 'x'
		? (target.clientWidth || rect.width || target.width || 1)
		: (target.clientHeight || rect.height || target.height || 1);
	const canvasSize = axis === 'x' ? target.width : target.height;

	return raw * (canvasSize / clientSize);
}

export function getCanvasX(event: MouseEvent | TouchEvent): number {
	return getScaledCanvasCoordinate(event, 'x');
}

export function getCanvasY(event: MouseEvent | TouchEvent): number {
	return getScaledCanvasCoordinate(event, 'y');
}
