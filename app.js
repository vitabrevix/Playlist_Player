class PlaylistPlayer {
	constructor() {
		this.tracks = [];
		this.currentIndex = 0;
		this.isPlaying = false;
		this.shouldAutoPlay = false; // Track if we should auto-continue playing
		this.autoShuffleEnabled = false; // Track if auto-shuffle is enabled
		this.audioPlayer = document.getElementById('audioPlayer');
		this.playlistElement = document.getElementById('playlist');
		this.statusDisplay = document.getElementById('statusDisplay');
		
		this.initializeElements();
		this.setupEventListeners();
		this.loadFromStorage();
	}
	
	initializeElements() {
		this.urlInput = document.getElementById('urlInput');
		this.addBtn = document.getElementById('addBtn');
		this.prevBtn = document.getElementById('prevBtn');
		this.nextBtn = document.getElementById('nextBtn');
		this.shuffleBtn = document.getElementById('shuffleBtn');
		this.autoShuffleBtn = document.getElementById('autoShuffleBtn');
		this.currentTitle = document.getElementById('currentTitle');
		this.currentNumber = document.getElementById('currentNumber');
		this.darkModeBtn = document.getElementById('darkModeBtn');
		this.clearBtn = document.getElementById('clearBtn');
		this.importBtn = document.getElementById('importBtn');
		this.exportBtn = document.getElementById('exportBtn');
		this.importFile = document.getElementById('importFile');
	}
	
	setupEventListeners() {
		this.addBtn.addEventListener('click', () => this.addTrack());
		this.urlInput.addEventListener('keypress', (e) => {
			if (e.key === 'Enter') this.addTrack();
		});
		
		this.prevBtn.addEventListener('click', () => this.previousTrack());
		this.nextBtn.addEventListener('click', () => this.nextTrack());
		this.shuffleBtn.addEventListener('click', () => this.shufflePlaylist());
		this.autoShuffleBtn.addEventListener('click', () => this.toggleAutoShuffle());
		this.darkModeBtn.addEventListener('click', () => this.toggleDarkMode());
		
		// Fixed: Add event listeners for clear, import, and export buttons
		this.clearBtn.addEventListener('click', () => this.clearPlaylist());
		this.importBtn.addEventListener('click', () => this.importFile.click());
		this.exportBtn.addEventListener('click', () => this.exportPlaylist());
		this.importFile.addEventListener('change', (e) => this.importPlaylist(e));
		
		this.audioPlayer.addEventListener('ended', () => {
			// When a track ends naturally, we should continue playing
			this.shouldAutoPlay = true;
			
			// Check if we're at the last track and auto-shuffle is enabled
			if (this.currentIndex === this.tracks.length - 1 && this.autoShuffleEnabled) {
				this.shufflePlaylist();
				this.showStatus('Auto-shuffling playlist!', 'playing');
				setTimeout(() => this.hideStatus(), 2000);
			}
			
			this.nextTrack();
		});
		this.audioPlayer.addEventListener('play', () => {
			this.shouldAutoPlay = true; // User started playing, remember this
			this.updatePlayPauseButton(true);
		});
		this.audioPlayer.addEventListener('pause', () => {
			// Only stop auto-playing if user manually paused
			if (!this.audioPlayer.ended) {
				this.shouldAutoPlay = false;
			}
			this.updatePlayPauseButton(false);
		});
		this.audioPlayer.addEventListener('error', (e) => this.handleAudioError(e));
		this.audioPlayer.addEventListener('loadstart', () => this.showStatus('Loading track...', 'playing'));
		this.audioPlayer.addEventListener('canplay', () => this.hideStatus());
	}
	
	toggleDarkMode() {
		document.body.classList.toggle('dark-mode');
		const isDarkMode = document.body.classList.contains('dark-mode');
		
		this.darkModeBtn.textContent = isDarkMode ? '☀️' : '🌙';
		
		this.showStatus(`${isDarkMode ? 'Dark' : 'Light'} mode activated!`, 'playing');
		setTimeout(() => this.hideStatus(), 2000);
	}
	
	addTrack() {
		const url = this.urlInput.value.trim();
		if (!url) return;
		
		// More lenient URL validation for audio content
		if (!this.isValidUrl(url)) {
			this.showStatus('Please enter a valid URL', 'error');
			return;
		}
		
		this.tracks.push(url);
		this.urlInput.value = '';
		this.renderPlaylist();
		this.saveToStorage();
		
		if (this.tracks.length === 1) {
			this.loadTrack(0);
		}
		
		this.showStatus('Track added! Testing playback...', 'playing');
	}
	
	isValidUrl(url) {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}
	
	// Keep the old function but make it less restrictive
	isValidAudioUrl(url) {
		try {
			const urlObj = new URL(url);
			const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.webm'];
			const hasAudioExt = audioExtensions.some(ext => 
				urlObj.pathname.toLowerCase().includes(ext)
			);
			// Accept URLs with audio extensions or common audio-related terms
			return hasAudioExt || 
				   url.toLowerCase().includes('audio') || 
				   url.toLowerCase().includes('music') ||
				   url.toLowerCase().includes('sound') ||
				   url.toLowerCase().includes('track') ||
				   url.toLowerCase().includes('podcast');
		} catch {
			return false;
		}
	}
	
	removeTrack(index) {
		if (index === this.currentIndex && this.isPlaying) {
			this.audioPlayer.pause();
		}
		
		this.tracks.splice(index, 1);
		
		if (index < this.currentIndex) {
			this.currentIndex--;
		} else if (index === this.currentIndex && this.currentIndex >= this.tracks.length) {
			this.currentIndex = 0;
		}
		
		this.renderPlaylist();
		this.saveToStorage();
		
		if (this.tracks.length === 0) {
			this.audioPlayer.src = '';
			this.currentTitle.textContent = 'No track selected';
			this.currentNumber.textContent = '';
		} else {
			this.loadTrack(this.currentIndex);
		}
	}
	
	loadTrack(index, forceAutoPlay = false) {
		if (index < 0 || index >= this.tracks.length) return;
		
		this.currentIndex = index;
		this.audioPlayer.src = this.tracks[index];
		
		const trackName = this.getTrackName(this.tracks[index]);
		this.currentTitle.textContent = trackName;
		this.currentNumber.textContent = `Track ${index + 1} of ${this.tracks.length}`;
		
		this.renderPlaylist();
		
		// Auto-play if we should be playing or if forced
		if (this.shouldAutoPlay || forceAutoPlay) {
			// Use multiple attempts to ensure playback starts
			const attemptPlay = () => {
				this.audioPlayer.play().then(() => {
					console.log('Auto-play successful');
				}).catch(e => {
					console.log('Auto-play failed, retrying...', e);
					// Retry after a short delay
					setTimeout(attemptPlay, 100);
				});
			};
			
			// Try immediately and also after load
			attemptPlay();
			this.audioPlayer.addEventListener('canplay', attemptPlay, { once: true });
		}
	}
	
	getTrackName(url) {
		try {
			const urlObj = new URL(url);
			const pathname = urlObj.pathname;
			const filename = pathname.split('/').pop();
			return filename || `Track from ${urlObj.hostname}`;
		} catch {
			return 'Unknown Track';
		}
	}
	
	previousTrack() {
		if (this.tracks.length === 0) return;
		
		const newIndex = this.currentIndex - 1 < 0 
			? this.tracks.length - 1 
			: this.currentIndex - 1;
		
		this.loadTrack(newIndex);
	}
	
	nextTrack() {
		if (this.tracks.length === 0) return;
		
		const newIndex = (this.currentIndex + 1) % this.tracks.length;
		this.loadTrack(newIndex);
	}
	
	toggleAutoShuffle() {
		this.autoShuffleEnabled = !this.autoShuffleEnabled;
		
		if (this.autoShuffleEnabled) {
			this.autoShuffleBtn.textContent = '🔄 Auto-Shuffle: ON';
			this.autoShuffleBtn.className = 'auto-shuffle-on';
			this.showStatus('Auto-shuffle enabled! Playlist will shuffle after last track', 'playing');
		} else {
			this.autoShuffleBtn.textContent = '🔄 Auto-Shuffle: OFF';
			this.autoShuffleBtn.className = 'auto-shuffle-off';
			this.showStatus('Auto-shuffle disabled', 'playing');
		}
		
		setTimeout(() => this.hideStatus(), 2000);
		this.saveToStorage();
	}
	
	togglePlayPause() {
		if (this.tracks.length === 0) {
			this.showStatus('Add some tracks first!', 'error');
			return;
		}
		
		if (this.audioPlayer.paused) {
			this.shouldAutoPlay = true; // User wants to play
			this.audioPlayer.play().catch(e => this.handleAudioError(e));
		} else {
			this.shouldAutoPlay = false; // User wants to pause
			this.audioPlayer.pause();
		}
	}
	
	updatePlayPauseButton(playing) {
		this.isPlaying = playing;
		// Note: This function references playPauseBtn which doesn't exist in HTML
		// You may want to add this button or remove this function
		if (this.playPauseBtn) {
			this.playPauseBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
		}
	}
	
	shufflePlaylist() {
		if (this.tracks.length < 2) return;
		
		const currentTrack = this.tracks[this.currentIndex];
		
		for (let i = this.tracks.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
		}
		
		this.currentIndex = this.tracks.indexOf(currentTrack);
		this.renderPlaylist();
		this.saveToStorage();
		
		this.showStatus('Playlist shuffled!', 'playing');
		setTimeout(() => this.hideStatus(), 2000);
	}
	
	clearPlaylist() {
		if (this.tracks.length === 0) {
			this.showStatus('Playlist is already empty!', 'error');
			setTimeout(() => this.hideStatus(), 2000);
			return;
		}
		
		// Ask for confirmation
		if (!confirm('Are you sure you want to clear all tracks from the playlist?')) {
			return;
		}
		
		// Stop and clear audio
		this.audioPlayer.pause();
		this.audioPlayer.src = '';
		this.shouldAutoPlay = false;
		
		// Clear playlist data
		this.tracks = [];
		this.currentIndex = 0;
		
		// Update UI
		this.currentTitle.textContent = 'No track selected';
		this.currentNumber.textContent = '';
		this.renderPlaylist();
		this.saveToStorage();
		
		this.showStatus('Playlist cleared!', 'playing');
		setTimeout(() => this.hideStatus(), 2000);
	}
	
	exportPlaylist() {
		if (this.tracks.length === 0) {
			this.showStatus('No tracks to export!', 'error');
			setTimeout(() => this.hideStatus(), 2000);
			return;
		}
		
		// Create playlist data with each URL on a new line
		const playlistData = this.tracks.join('\n');
		
		// Create and download file
		const blob = new Blob([playlistData], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `audio-playlist-${new Date().toISOString().split('T')[0]}.txt`;
		a.style.display = 'none';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		
		this.showStatus(`Playlist exported! ${this.tracks.length} tracks saved to file.`, 'playing');
		setTimeout(() => this.hideStatus(), 3000);
	}
	
	importPlaylist(event) {
		const file = event.target.files[0];
		if (!file) return;
		
		// Check file type
		if (!file.name.toLowerCase().endsWith('.txt')) {
			this.showStatus('Please select a .txt file!', 'error');
			setTimeout(() => this.hideStatus(), 3000);
			return;
		}
		
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target.result;
				const urls = content.split('\n')
					.map(line => line.trim())
					.filter(line => line && this.isValidUrl(line));
				
				if (urls.length === 0) {
					this.showStatus('No valid URLs found in file!', 'error');
					setTimeout(() => this.hideStatus(), 3000);
					return;
				}
				
				// Ask user if they want to replace or append (if there are existing tracks)
				let shouldReplace = true;
				if (this.tracks.length > 0) {
					shouldReplace = confirm(
						`Found ${urls.length} valid URLs in the file.\n\n` +
						`Current playlist has ${this.tracks.length} tracks.\n\n` +
						`Click OK to REPLACE current playlist\n` +
						`Click Cancel to ADD to current playlist`
					);
				}
				
				if (shouldReplace) {
					// Stop current playback and clear playlist
					this.audioPlayer.pause();
					this.audioPlayer.src = '';
					this.shouldAutoPlay = false;
					this.tracks = [];
					this.currentIndex = 0;
				}
				
				// Add new tracks
				const startIndex = this.tracks.length;
				this.tracks.push(...urls);
				
				// Load first track if playlist was empty
				if (startIndex === 0 && this.tracks.length > 0) {
					this.loadTrack(0);
				}
				
				this.renderPlaylist();
				this.saveToStorage();
				
				const action = shouldReplace ? 'Imported' : 'Added';
				this.showStatus(`${action} ${urls.length} tracks successfully!`, 'playing');
				setTimeout(() => this.hideStatus(), 3000);
				
			} catch (error) {
				console.error('Import error:', error);
				this.showStatus('Error reading file!', 'error');
				setTimeout(() => this.hideStatus(), 3000);
			}
		};
		
		reader.onerror = () => {
			this.showStatus('Error reading file!', 'error');
			setTimeout(() => this.hideStatus(), 3000);
		};
		
		reader.readAsText(file);
		
		// Reset file input so the same file can be selected again if needed
		event.target.value = '';
	}
	
	renderPlaylist() {
		if (this.tracks.length === 0) {
			this.playlistElement.innerHTML = `
				<div style="text-align: center; opacity: 0.6; padding: 20px;">
					No tracks added yet. Add some audio URLs above!
				</div>
			`;
			return;
		}
		
		this.playlistElement.innerHTML = this.tracks.map((track, index) => `
			<div class="track-item ${index === this.currentIndex ? 'current' : ''}" 
				 onclick="player.loadTrack(${index})">
				<div class="track-info">
					<div>Track ${index + 1}: ${this.getTrackName(track)}</div>
					<div class="track-url">${track}</div>
				</div>
				<button class="remove-btn" onclick="event.stopPropagation(); player.removeTrack(${index})">
					Remove
				</button>
			</div>
		`).join('');
	}
	
	handleAudioError(e) {
		console.error('Audio error:', e);
		
		let errorMessage = 'Error loading audio: ';
		
		if (e.target && e.target.error) {
			switch(e.target.error.code) {
				case e.target.error.MEDIA_ERR_ABORTED:
					errorMessage += 'Playback aborted';
					break;
				case e.target.error.MEDIA_ERR_NETWORK:
					errorMessage += 'Network error - check your connection';
					break;
				case e.target.error.MEDIA_ERR_DECODE:
					errorMessage += 'Audio format not supported';
					break;
				case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
					errorMessage += 'Audio source not supported or CORS blocked';
					break;
				default:
					errorMessage += 'Unknown error';
			}
		} else {
			errorMessage += 'CORS restriction or invalid URL';
		}
		
		this.showStatus(errorMessage, 'error');
		
		// Try to play next track after a short delay
		setTimeout(() => {
			if (this.tracks.length > 1) {
				this.nextTrack();
			}
		}, 2000);
	}
	
	showStatus(message, type) {
		this.statusDisplay.textContent = message;
		this.statusDisplay.className = `status ${type}`;
		this.statusDisplay.style.display = 'block';
	}
	
	hideStatus() {
		this.statusDisplay.style.display = 'none';
	}
	
	saveToStorage() {
		try {
			const data = {
				tracks: this.tracks,
				currentIndex: this.currentIndex,
				autoShuffleEnabled: this.autoShuffleEnabled,
				darkMode: document.body.classList.contains('dark-mode')
			};
			localStorage.setItem('audioPlaylistPlayer', JSON.stringify(data));
		} catch (error) {
			console.error('Error saving to storage:', error);
		}
	}
	
	loadFromStorage() {
		try {
			const data = localStorage.getItem('audioPlaylistPlayer');
			if (data) {
				const parsed = JSON.parse(data);
				this.tracks = parsed.tracks || [];
				this.currentIndex = parsed.currentIndex || 0;
				this.autoShuffleEnabled = parsed.autoShuffleEnabled || false;
				
				// Apply dark mode
				if (parsed.darkMode) {
					document.body.classList.add('dark-mode');
					this.darkModeBtn.textContent = '☀️';
				}
				
				// Update auto-shuffle button
				if (this.autoShuffleEnabled) {
					this.autoShuffleBtn.textContent = '🔄 Auto-Shuffle: ON';
					this.autoShuffleBtn.className = 'auto-shuffle-on';
				}
				
				// Render playlist and load current track
				this.renderPlaylist();
				if (this.tracks.length > 0 && this.currentIndex < this.tracks.length) {
					this.loadTrack(this.currentIndex);
				}
			}
		} catch (error) {
			console.error('Error loading from storage:', error);
		}
	}
}

// Initialize the player
const player = new PlaylistPlayer();