export class SoundHandlerService {
	private audioContext;
	private curSource;
	public audioBuffer;
	public playbackBuffer;
	public isPlaying;

	constructor() {
		this.audioBuffer = {};
		this.playbackBuffer = null;
		this.isPlaying = false;
	}

	private initAudioContext() {
		try {
			window.AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
			this.audioContext = new AudioContext();
		} catch (e) {
			console.error('Error loading AudioContext (browser may not support Web Audio API):', e);
		}
	}

	public decodeAndPlay(sampleStart, endSample) {
		if (typeof(this.audioContext) === 'undefined') {
			this.initAudioContext();
		}
		if (this.audioContext.state === 'suspended') {
			this.audioContext.resume().then(() => {
				this.startPlayback(sampleStart, endSample);
			}).catch((err) => {
				console.error('Failed to resume audio context:', err);
			});
		} else {
			this.startPlayback(sampleStart, endSample);
		}
	};

	// libav/resampler output is AudioBufferLike; createBufferSource needs a real AudioBuffer
	private toNativeBuffer(buf) {
		if (typeof AudioBuffer !== 'undefined' && buf instanceof AudioBuffer) return buf;
		if (typeof buf.getChannelData !== 'function' || typeof this.audioContext.createBuffer !== 'function') return buf;
		const native = this.audioContext.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
		for (let ch = 0; ch < buf.numberOfChannels; ch++) native.copyToChannel(buf.getChannelData(ch), ch);
		return native;
	}

	private startPlayback(sampleStart, endSample) {
		var startTime = sampleStart / this.audioBuffer.sampleRate;
		var endTime = endSample / this.audioBuffer.sampleRate;
		var durTime = endTime - startTime;
		var srcBuffer = this.toNativeBuffer(this.playbackBuffer || this.audioBuffer);
		this.curSource = this.audioContext.createBufferSource();
		this.curSource.buffer = srcBuffer;
		this.curSource.connect(this.audioContext.destination);
		this.curSource.start(0, startTime, durTime);
		this.curSource.onended = () => { this.isPlaying = false; };
	};

	public playFromTo(sampleStart, endSample) {
		if (this.isPlaying) {
			this.isPlaying = false;
			try { this.curSource?.stop(0); } catch (e) { /* not started yet */ }
		} else if (this.audioBuffer.length > 0) {
			this.isPlaying = true;
			this.decodeAndPlay(sampleStart, endSample);
		}
	};
}

export const soundHandlerService = new SoundHandlerService();
