class PlaylistPlayer {
	constructor() {
		this.tracks = [];
		this.currentIndex = 0;
		this.isPlaying = false;
		this.shouldAutoPlay = false;
		this.autoShuffleEnabled = false;
		this.loopMode = 'all';
		this.audioPlayer = document.getElementById('audioPlayer');
		this.playlistElement = document.getElementById('playlist');
		this.statusDisplay = document.getElementById('statusDisplay');
		this.collections = [];
		this.customCollections = [];
		
		this.initializeElements();
		this.setupEventListeners();
		this.loadCollections();
		this.loadFromStorage();
	}
	
	initializeElements() {
		this.urlInput = document.getElementById('urlInput');
		this.addBtn = document.getElementById('addBtn');
		this.prevBtn = document.getElementById('prevBtn');
		this.nextBtn = document.getElementById('nextBtn');
		this.shuffleBtn = document.getElementById('shuffleBtn');
		this.autoShuffleBtn = document.getElementById('autoShuffleBtn');
		this.loopBtn = document.getElementById('loopBtn');
		this.currentTitle = document.getElementById('currentTitle');
		this.currentNumber = document.getElementById('currentNumber');
		this.darkModeBtn = document.getElementById('darkModeBtn');
		this.clearBtn = document.getElementById('clearBtn');
		this.importBtn = document.getElementById('importBtn');
		this.exportBtn = document.getElementById('exportBtn');
		this.saveAsDrawerBtn = document.getElementById('saveAsDrawerBtn');
		this.importFile = document.getElementById('importFile');
		this.drawersContainer = document.getElementById('drawers-container');
		this.createDrawerBtn = document.getElementById('createDrawerBtn');
		
		// Save collection form elements
		this.saveCollectionForm = document.getElementById('saveCollectionForm');
		this.saveCollectionName = document.getElementById('saveCollectionName');
		this.saveCollectionDescription = document.getElementById('saveCollectionDescription');
		this.saveCollectionConfirmBtn = document.getElementById('saveCollectionConfirmBtn');
		this.saveCollectionCancelBtn = document.getElementById('saveCollectionCancelBtn');
		
		// New collection form elements
		this.newCollectionForm = document.getElementById('newCollectionForm');
		this.newCollectionName = document.getElementById('newCollectionName');
		this.newCollectionDescription = document.getElementById('newCollectionDescription');
		this.saveCollectionBtn = document.getElementById('saveCollectionBtn');
		this.cancelCollectionBtn = document.getElementById('cancelCollectionBtn');
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
		this.loopBtn.addEventListener('click', () => this.toggleLoop());
		this.darkModeBtn.addEventListener('click', () => this.toggleDarkMode());
		
		if (this.clearBtn) {
			this.clearBtn.addEventListener('click', () => this.clearPlaylist());
		}
		
		if (this.importBtn) {
			this.importBtn.addEventListener('click', () => this.importFile.click());
		}
		
		if (this.exportBtn) {
			this.exportBtn.addEventListener('click', () => this.exportPlaylist());
		}
		
		if (this.saveAsDrawerBtn) {
			this.saveAsDrawerBtn.addEventListener('click', () => this.savePlaylistAsDrawer());
		}
		
		this.importFile.addEventListener('change', (e) => this.importPlaylist(e));
		
		this.createDrawerBtn.addEventListener('click', () => this.toggleCollectionForm());
		this.saveCollectionBtn.addEventListener('click', () => this.saveNewCollection());
		this.cancelCollectionBtn.addEventListener('click', () => this.hideCollectionForm());
		
		// Save collection form listeners
		if (this.saveCollectionConfirmBtn) {
			this.saveCollectionConfirmBtn.addEventListener('click', () => this.confirmSavePlaylistAsDrawer());
		}
		if (this.saveCollectionCancelBtn) {
			this.saveCollectionCancelBtn.addEventListener('click', () => this.hideSaveCollectionForm());
		}
		
		// Event delegation for delete buttons
		this.drawersContainer.addEventListener('click', (e) => {
			// Check if click was on delete button or its parent
			const deleteTrackBtn = e.target.closest('.drawer-item-delete-btn');
			const deleteCollectionBtn = e.target.closest('.drawer-delete-btn');
			const addAllBtn = e.target.closest('.drawer-add-all-btn');
			
			// Add all tracks from drawer to playlist
			if (addAllBtn) {
				e.stopPropagation();
				e.preventDefault();
				const collectionId = addAllBtn.getAttribute('data-collection-id');
				this.addAllTracksFromDrawer(collectionId);
				return;
			}
			
			// Delete track from collection
			if (deleteTrackBtn) {
				e.stopPropagation();
				e.preventDefault();
				const collectionId = deleteTrackBtn.getAttribute('data-collection-id');
				const trackIndex = parseInt(deleteTrackBtn.getAttribute('data-track-index'));
				this.deleteTrackFromDrawer(collectionId, trackIndex);
				return;
			}
			
			// Delete entire collection
			if (deleteCollectionBtn) {
				e.stopPropagation();
				e.preventDefault();
				const collectionId = deleteCollectionBtn.getAttribute('data-collection-id');
				this.deleteDrawer(collectionId);
				return;
			}
		});
		
		this.audioPlayer.addEventListener('ended', () => {
			// Handle loop mode: 'one' (repeat current track)
			if (this.loopMode === 'one') {
				this.shouldAutoPlay = true;
				this.audioPlayer.currentTime = 0;
				this.audioPlayer.play();
				return;
			}
			
			// If we're at the last track and loop is off, stop
			if (this.currentIndex === this.tracks.length - 1 && this.loopMode === 'off') {
				this.shouldAutoPlay = false;
				return;
			}
			
			this.shouldAutoPlay = true;
			
			if (this.currentIndex === this.tracks.length - 1 && this.autoShuffleEnabled) {
				this.shufflePlaylist();
				this.showStatus('Auto-shuffling playlist!', 'playing');
				setTimeout(() => this.hideStatus(), 2000);
			}
			
			this.nextTrack();
		});
		this.audioPlayer.addEventListener('play', () => {
			this.shouldAutoPlay = true;
			this.updatePlayPauseButton(true);
		});
		this.audioPlayer.addEventListener('pause', () => {
			if (!this.audioPlayer.ended) {
				this.shouldAutoPlay = false;
			}
			this.updatePlayPauseButton(false);
		});
		this.audioPlayer.addEventListener('error', (e) => this.handleAudioError(e));
		this.audioPlayer.addEventListener('loadstart', () => this.showStatus('Loading track...', 'playing'));
		this.audioPlayer.addEventListener('canplay', () => this.hideStatus());
	}
	
	async loadCollections() {
		try {
			// Load collections from database.js (audioCollections array)
			if (typeof audioCollections !== 'undefined') {
				this.collections = audioCollections.map((collection, index) => {
					const [title, description, tracks] = collection;
					return {
						id: `collection_${index}`,
						title: title,
						description: description,
						tracks: tracks.map((track, trackIndex) => {
							if (typeof track === 'string') {
								return {
									title: this.getTrackName(track),
									url: track
								};
							} else {
								return {
									title: track.title || this.getTrackName(track.url),
									url: track.url
								};
							}
						})
					};
				});
			} else {
				console.warn('audioCollections not found in database.js');
				this.collections = [];
			}
			
			// Load custom collections from localStorage
			const savedCustom = localStorage.getItem('customCollections');
			if (savedCustom) {
				this.customCollections = JSON.parse(savedCustom);
			}
			
			this.renderDrawers();
		} catch (error) {
			console.error('Error loading collections:', error);
			this.showStatus('Error loading audio collections', 'error');
			setTimeout(() => this.hideStatus(), 3000);
		}
	}
	
	renderDrawers() {
		this.drawersContainer.innerHTML = '';
		
		// Render default collections
		this.collections.forEach(collection => {
			this.renderDrawer(collection, false);
		});
		
		// Render custom collections
		this.customCollections.forEach(collection => {
			this.renderDrawer(collection, true);
		});
	}
	
	renderDrawer(collection, isCustom) {
		const drawer = document.createElement('div');
		drawer.className = 'drawer';
		drawer.dataset.drawerId = collection.id;
		
		const header = document.createElement('div');
		header.className = 'drawer-header';
		header.dataset.drawer = collection.id;
		
		const headerContent = document.createElement('div');
		headerContent.style.flex = '1';
		headerContent.innerHTML = `
			<div style="display: flex; align-items: center; gap: 10px;">
				<span class="drawer-icon">▶</span>
				<div style="flex: 1;">
					<div style="display: flex; align-items: center; gap: 8px;">
						<span class="drawer-title">${collection.title}</span>
						<span class="drawer-count">(${collection.tracks.length} tracks)</span>
					</div>
					${collection.description ? `<div style="font-size: 0.85em; opacity: 0.7; margin-top: 4px;">${collection.description}</div>` : ''}
				</div>
			</div>
		`;
		
		header.appendChild(headerContent);
		
		// Add actions container for all drawers
		const actions = document.createElement('div');
		actions.className = 'drawer-actions';
		
		// Add "Add All to Playlist" button for all drawers
		const addAllBtn = document.createElement('button');
		addAllBtn.className = 'drawer-add-all-btn';
		addAllBtn.innerHTML = '<span class="drawer-add-all-btn-text">➕ Add All to Playlist</span>';
		addAllBtn.setAttribute('data-collection-id', collection.id);
		actions.appendChild(addAllBtn);
		
		// Add delete button only for custom drawers
		if (isCustom) {
			const deleteBtn = document.createElement('button');
			deleteBtn.className = 'drawer-delete-btn';
			deleteBtn.textContent = '🗑️ Delete';
			deleteBtn.setAttribute('data-collection-id', collection.id);
			actions.appendChild(deleteBtn);
		}
		
		header.appendChild(actions);
		
		const content = document.createElement('div');
		content.className = 'drawer-content';
		content.id = `drawer-${collection.id}`;
		
		// Render tracks
		collection.tracks.forEach((track, index) => {
			const item = document.createElement('div');
			item.className = 'drawer-item';
			
			const itemHeader = document.createElement('div');
			itemHeader.className = 'drawer-item-header';
			itemHeader.innerHTML = `
				<span class="drawer-item-title">${track.title}</span>
			`;
			
			const itemUrl = document.createElement('div');
			itemUrl.className = 'drawer-item-url';
			itemUrl.textContent = track.url;
			
			item.appendChild(itemHeader);
			item.appendChild(itemUrl);
			
			// Add delete button for custom drawer tracks
			if (isCustom) {
				const deleteTrackBtn = document.createElement('button');
				deleteTrackBtn.className = 'drawer-item-delete-btn';
				deleteTrackBtn.textContent = '🗑️';
				deleteTrackBtn.title = 'Delete this track';
				deleteTrackBtn.setAttribute('data-collection-id', collection.id);
				deleteTrackBtn.setAttribute('data-track-index', index);
				itemHeader.appendChild(deleteTrackBtn);
			}
			
			// Click to add track to playlist
			item.addEventListener('click', (e) => {
				// Don't add track if clicking on delete button
				if (e.target.closest('.drawer-item-delete-btn')) {
					return;
				}
				this.addTrackFromDrawer(track.url, track.title);
			});
			
			content.appendChild(item);
		});
		
		// Add "Add Track" form for custom drawers
		if (isCustom) {
			const addTrackSection = document.createElement('div');
			addTrackSection.className = 'add-track-section';
			addTrackSection.innerHTML = `
				<button class="drawer-add-track-toggle" data-collection-id="${collection.id}">
					➕ Add Track to Collection
				</button>
				<div class="new-track-form" id="track-form-${collection.id}" style="display: none;">
					<div class="form-group">
						<input type="url" class="track-url-input" placeholder="Audio URL *" />
					</div>
					<div class="form-group">
						<input type="text" class="track-title-input" placeholder="Track Title (optional - auto-generated if empty)" />
					</div>
					<div class="form-actions">
						<button class="form-btn save-btn track-save-btn">Add Track</button>
						<button class="form-btn cancel-btn track-cancel-btn">Cancel</button>
					</div>
				</div>
			`;
			
			const toggleBtn = addTrackSection.querySelector('.drawer-add-track-toggle');
			const trackForm = addTrackSection.querySelector('.new-track-form');
			const urlInput = addTrackSection.querySelector('.track-url-input');
			const titleInput = addTrackSection.querySelector('.track-title-input');
			const saveBtn = addTrackSection.querySelector('.track-save-btn');
			const cancelBtn = addTrackSection.querySelector('.track-cancel-btn');
			
			toggleBtn.addEventListener('click', () => {
				if (trackForm.style.display === 'none') {
					trackForm.style.display = 'block';
					toggleBtn.textContent = '✖️ Cancel';
					urlInput.focus();
				} else {
					trackForm.style.display = 'none';
					toggleBtn.textContent = '➕ Add Track to Collection';
					urlInput.value = '';
					titleInput.value = '';
				}
			});
			
			saveBtn.addEventListener('click', () => {
				const url = urlInput.value.trim();
				
				if (!url) {
					this.showStatus('Please enter a URL!', 'error');
					setTimeout(() => this.hideStatus(), 2000);
					return;
				}
				
				if (!this.isValidUrl(url)) {
					this.showStatus('Please enter a valid URL!', 'error');
					setTimeout(() => this.hideStatus(), 2000);
					return;
				}
				
				const title = titleInput.value.trim() || this.getTrackName(url);
				
				collection.tracks.push({
					title: title,
					url: url
				});
				
				this.saveCustomCollections();
				this.renderDrawers();
				
				this.showStatus(`Added "${title}" to collection!`, 'playing');
				setTimeout(() => this.hideStatus(), 2000);
			});
			
			cancelBtn.addEventListener('click', () => {
				trackForm.style.display = 'none';
				toggleBtn.textContent = '➕ Add Track to Collection';
				urlInput.value = '';
				titleInput.value = '';
			});
			
			content.appendChild(addTrackSection);
		}
		
		drawer.appendChild(header);
		drawer.appendChild(content);
		this.drawersContainer.appendChild(drawer);
		
		// Setup toggle
		header.addEventListener('click', (e) => {
			// Don't toggle if clicking on action buttons
			if (e.target.closest('.drawer-delete-btn') || 
			    e.target.closest('.drawer-add-all-btn') ||
			    e.target.closest('.drawer-actions')) {
				return;
			}
			header.classList.toggle('active');
			content.classList.toggle('open');
		});
	}
	
	addTrackFromDrawer(url, title) {
		this.tracks.push({ title, url });
		this.renderPlaylist();
		this.saveToStorage();
		
		if (this.tracks.length === 1) {
			this.loadTrack(0);
		}
		
		this.showStatus(`Added "${title}" to playlist!`, 'playing');
		setTimeout(() => this.hideStatus(), 2000);
	}
	
	toggleCollectionForm() {
		if (this.newCollectionForm.style.display === 'none') {
			this.newCollectionForm.style.display = 'block';
			this.createDrawerBtn.textContent = '✖️ Cancel';
			this.newCollectionName.focus();
		} else {
			this.hideCollectionForm();
		}
	}
	
	hideCollectionForm() {
		this.newCollectionForm.style.display = 'none';
		this.createDrawerBtn.textContent = '➕ Create Custom Collection';
		this.newCollectionName.value = '';
		this.newCollectionDescription.value = '';
	}
	
	saveNewCollection() {
		const title = this.newCollectionName.value.trim();
		
		if (!title) {
			this.showStatus('Please enter a collection name!', 'error');
			setTimeout(() => this.hideStatus(), 2000);
			return;
		}
		
		const description = this.newCollectionDescription.value.trim();
		
		const id = 'custom_' + Date.now();
		const newCollection = {
			id: id,
			title: title,
			description: description,
			tracks: []
		};
		
		this.customCollections.push(newCollection);
		this.saveCustomCollections();
		this.renderDrawers();
		this.hideCollectionForm();
		
		this.showStatus(`Created collection "${title}"!`, 'playing');
		setTimeout(() => this.hideStatus(), 2000);
	}
	
	deleteTrackFromDrawer(collectionId, trackIndex) {
		const collection = this.customCollections.find(c => c.id === collectionId);
		if (!collection) return;
		
		const deletedTrack = collection.tracks[trackIndex];
		
		collection.tracks.splice(trackIndex, 1);
		
		this.saveCustomCollections();
		this.renderDrawers();
		
		this.showStatus(`Deleted "${deletedTrack.title}" from collection!`, 'playing');
		setTimeout(() => this.hideStatus(), 2000);
	}
	
	deleteDrawer(collectionId) {
		const collection = this.customCollections.find(c => c.id === collectionId);
		if (!collection) return;
		
		this.customCollections = this.customCollections.filter(c => c.id !== collectionId);
		this.saveCustomCollections();
		this.renderDrawers();
		
		this.showStatus(`Deleted collection "${collection.title}"!`, 'playing');
		setTimeout(() => this.hideStatus(), 2000);
	}
	
	saveCustomCollections() {
		try {
			localStorage.setItem('customCollections', JSON.stringify(this.customCollections));
		} catch (error) {
			console.error('Error saving custom collections:', error);
			this.showStatus('Error saving custom collections!', 'error');
			setTimeout(() => this.hideStatus(), 3000);
		}
	}
	
	addTrack() {
		const url = this.urlInput.value.trim();
		
		if (!url) {
			this.showStatus('Please enter an audio URL!', 'error');
			setTimeout(() => this.hideStatus(), 2000);
			return;
		}
		
		if (!this.isValidUrl(url)) {
			this.showStatus('Please enter a valid URL!', 'error');
			setTimeout(() => this.hideStatus(), 2000);
			return;
		}
		
		// Get title from filename automatically
		const title = this.getTrackName(url);
		
		this.tracks.push({ title, url });
		this.urlInput.value = '';
		this.renderPlaylist();
		this.saveToStorage();
		
		if (this.tracks.length === 1) {
			this.loadTrack(0);
		}
		
		this.showStatus(`Added track "${title}"!`, 'playing');
		setTimeout(() => this.hideStatus(), 2000);
	}
	
	removeTrack(index) {
		const removedTrack = this.tracks[index];
		
		this.tracks.splice(index, 1);
		
		if (this.currentIndex === index) {
			this.audioPlayer.pause();
			this.audioPlayer.src = '';
			this.shouldAutoPlay = false;
			
			if (this.tracks.length > 0) {
				if (this.currentIndex >= this.tracks.length) {
					this.currentIndex = 0;
				}
				this.loadTrack(this.currentIndex);
			} else {
				this.currentIndex = 0;
				this.currentTitle.textContent = 'No track selected';
				this.currentNumber.textContent = '';
			}
		} else if (this.currentIndex > index) {
			this.currentIndex--;
		}
		
		this.renderPlaylist();
		this.saveToStorage();
		
		this.showStatus(`Removed "${removedTrack.title}"!`, 'playing');
		setTimeout(() => this.hideStatus(), 2000);
	}
	
	loadTrack(index) {
		if (index < 0 || index >= this.tracks.length) return;
		
		this.currentIndex = index;
		const track = this.tracks[index];
		this.audioPlayer.src = track.url;
		this.currentTitle.textContent = track.title;
		this.currentNumber.textContent = `Track ${index + 1} of ${this.tracks.length}`;
		
		this.renderPlaylist();
		
		if (this.shouldAutoPlay) {
			this.audioPlayer.play().catch(err => {
				console.error('Autoplay prevented:', err);
				this.showStatus('Click play to start audio', 'playing');
				setTimeout(() => this.hideStatus(), 3000);
			});
		}
		
		this.saveToStorage();
	}
	
	nextTrack() {
		if (this.tracks.length === 0) return;
		
		this.currentIndex = (this.currentIndex + 1) % this.tracks.length;
		this.loadTrack(this.currentIndex);
	}
	
	previousTrack() {
		if (this.tracks.length === 0) return;
		
		this.currentIndex = (this.currentIndex - 1 + this.tracks.length) % this.tracks.length;
		this.loadTrack(this.currentIndex);
	}
	
	getTrackName(url) {
		try {
			const urlObj = new URL(url);
			const pathname = urlObj.pathname;
			const filename = pathname.split('/').pop() || 'Unknown Track';
			return decodeURIComponent(filename).replace(/\.[^/.]+$/, '');
		} catch (e) {
			return 'Unknown Track';
		}
	}
	
	isValidUrl(string) {
		try {
			new URL(string);
			return true;
		} catch (_) {
			return false;
		}
	}
	
	toggleAutoShuffle() {
		this.autoShuffleEnabled = !this.autoShuffleEnabled;
		
		if (this.autoShuffleEnabled) {
			this.autoShuffleBtn.textContent = '🔄 Auto-Shuffle: ON';
			this.autoShuffleBtn.className = 'auto-shuffle-on';
			this.showStatus('Auto-shuffle enabled! Playlist will shuffle after last track.', 'playing');
		} else {
			this.autoShuffleBtn.textContent = '🔄 Auto-Shuffle: OFF';
			this.autoShuffleBtn.className = 'auto-shuffle-off';
			this.showStatus('Auto-shuffle disabled', 'playing');
		}
		
		setTimeout(() => this.hideStatus(), 2000);
		this.saveToStorage();
	}
	
	toggleLoop() {
		// Cycle through: all -> one -> off -> all
		if (this.loopMode === 'all') {
			this.loopMode = 'one';
			this.loopBtn.textContent = '🔂 Loop: Current Track';
			this.loopBtn.className = 'loop-one';
			this.showStatus('Loop mode: Current track will repeat', 'playing');
		} else if (this.loopMode === 'one') {
			this.loopMode = 'off';
			this.loopBtn.textContent = '🔁 Loop: OFF';
			this.loopBtn.className = 'loop-off';
			this.showStatus('Loop disabled! Playlist will stop after last track.', 'playing');
		} else {
			this.loopMode = 'all';
			this.loopBtn.textContent = '🔁 Loop: All Tracks';
			this.loopBtn.className = 'loop-on';
			this.showStatus('Loop mode: All tracks will repeat', 'playing');
		}
		
		setTimeout(() => this.hideStatus(), 2000);
		this.saveToStorage();
	}
	
	toggleDarkMode() {
		document.body.classList.toggle('dark-mode');
		
		if (document.body.classList.contains('dark-mode')) {
			this.darkModeBtn.textContent = '☀️';
		} else {
			this.darkModeBtn.textContent = '🌙';
		}
		
		this.saveToStorage();
	}
	
	updatePlayPauseButton(playing) {
		// This could be expanded if you add a play/pause button
	}
	
	shufflePlaylist() {
		if (this.tracks.length < 2) {
			this.showStatus('Need at least 2 tracks to shuffle!', 'error');
			setTimeout(() => this.hideStatus(), 2000);
			return;
		}
		
		const currentTrack = this.tracks[this.currentIndex];
		
		for (let i = this.tracks.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
		}
		
		this.currentIndex = this.tracks.findIndex(t => t.url === currentTrack.url);
		
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
		
		this.audioPlayer.pause();
		this.audioPlayer.src = '';
		this.shouldAutoPlay = false;
		
		this.tracks = [];
		this.currentIndex = 0;
		
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
		
		// Export as JSON with titles
		const playlistData = JSON.stringify(this.tracks, null, 2);
		
		const blob = new Blob([playlistData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `audio-playlist-${new Date().toISOString().split('T')[0]}.json`;
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
		
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const content = e.target.result;
				let importedTracks = [];
				
				// Try parsing as JSON first (new format)
				if (file.name.toLowerCase().endsWith('.json')) {
					try {
						const parsed = JSON.parse(content);
						if (Array.isArray(parsed)) {
							importedTracks = parsed.map(track => {
								if (typeof track === 'string') {
									return { title: this.getTrackName(track), url: track };
								} else if (track.url) {
									return {
										title: track.title || this.getTrackName(track.url),
										url: track.url
									};
								}
								return null;
							}).filter(t => t && this.isValidUrl(t.url));
						}
					} catch (jsonError) {
						console.error('JSON parse error:', jsonError);
					}
				} 
				
				// Fall back to plain text format (old format)
				if (importedTracks.length === 0) {
					const urls = content.split('\n')
						.map(line => line.trim())
						.filter(line => line && this.isValidUrl(line));
					
					importedTracks = urls.map(url => ({
						title: this.getTrackName(url),
						url: url
					}));
				}
				
				if (importedTracks.length === 0) {
					this.showStatus('No valid tracks found in file!', 'error');
					setTimeout(() => this.hideStatus(), 3000);
					return;
				}
				
				let shouldReplace = true;
				if (this.tracks.length > 0) {
					shouldReplace = confirm(
						`Found ${importedTracks.length} valid tracks in the file.\n\n` +
						`Current playlist has ${this.tracks.length} tracks.\n\n` +
						`Click OK to REPLACE current playlist\n` +
						`Click Cancel to ADD to current playlist`
					);
				}
				
				if (shouldReplace) {
					this.audioPlayer.pause();
					this.audioPlayer.src = '';
					this.shouldAutoPlay = false;
					this.tracks = [];
					this.currentIndex = 0;
				}
				
				const startIndex = this.tracks.length;
				this.tracks.push(...importedTracks);
				
				if (startIndex === 0 && this.tracks.length > 0) {
					this.loadTrack(0);
				}
				
				this.renderPlaylist();
				this.saveToStorage();
				
				const action = shouldReplace ? 'Imported' : 'Added';
				this.showStatus(`${action} ${importedTracks.length} tracks successfully!`, 'playing');
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
					<div class="track-title-display">${track.title}</div>
					<div class="track-url">${track.url}</div>
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
				loopMode: this.loopMode,
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
				
				// Migrate old format (array of strings) to new format (array of objects)
				if (parsed.tracks && Array.isArray(parsed.tracks)) {
					this.tracks = parsed.tracks.map(track => {
						if (typeof track === 'string') {
							return { title: this.getTrackName(track), url: track };
						} else {
							return {
								title: track.title || this.getTrackName(track.url),
								url: track.url
							};
						}
					});
				} else {
					this.tracks = [];
				}
				
				this.currentIndex = parsed.currentIndex || 0;
				this.autoShuffleEnabled = parsed.autoShuffleEnabled || false;
				
				// Migrate from old loopEnabled to new loopMode
				if (parsed.loopMode) {
					this.loopMode = parsed.loopMode;
				} else if (parsed.loopEnabled !== undefined) {
					// Migrate old boolean loopEnabled to new loopMode
					this.loopMode = parsed.loopEnabled ? 'all' : 'off';
				} else {
					this.loopMode = 'all'; // Default to 'all'
				}
				
				if (parsed.darkMode) {
					document.body.classList.add('dark-mode');
					this.darkModeBtn.textContent = '☀️';
				}
				
				if (this.autoShuffleEnabled) {
					this.autoShuffleBtn.textContent = '🔄 Auto-Shuffle: ON';
					this.autoShuffleBtn.className = 'auto-shuffle-on';
				}
				
				// Update loop button based on loopMode
				if (this.loopMode === 'all') {
					this.loopBtn.textContent = '🔁 Loop: All Tracks';
					this.loopBtn.className = 'loop-on';
				} else if (this.loopMode === 'one') {
					this.loopBtn.textContent = '🔂 Loop: Current Track';
					this.loopBtn.className = 'loop-one';
				} else {
					this.loopBtn.textContent = '🔁 Loop: OFF';
					this.loopBtn.className = 'loop-off';
				}
				
				this.renderPlaylist();
				if (this.tracks.length > 0 && this.currentIndex < this.tracks.length) {
					this.loadTrack(this.currentIndex);
				}
			}
		} catch (error) {
			console.error('Error loading from storage:', error);
		}
	}
	
	addAllTracksFromDrawer(collectionId) {
		// Find the collection
		let collection = this.collections.find(c => c.id === collectionId);
		if (!collection) {
			collection = this.customCollections.find(c => c.id === collectionId);
		}
		
		if (!collection || !collection.tracks || collection.tracks.length === 0) {
			this.showStatus('Collection not found or has no tracks!', 'error');
			setTimeout(() => this.hideStatus(), 3000);
			return;
		}
		
		// Add all tracks from the collection to the current playlist
		const tracksToAdd = collection.tracks.map(track => ({
			title: track.title,
			url: track.url
		}));
		
		const startIndex = this.tracks.length;
		this.tracks.push(...tracksToAdd);
		
		// If playlist was empty, load the first track
		if (startIndex === 0 && this.tracks.length > 0) {
			this.loadTrack(0);
		}
		
		this.renderPlaylist();
		this.saveToStorage();
		
		this.showStatus(`Added ${tracksToAdd.length} tracks from "${collection.title}" to playlist!`, 'playing');
		setTimeout(() => this.hideStatus(), 3000);
	}
	
	savePlaylistAsDrawer() {
		// Check if playlist has tracks
		if (this.tracks.length === 0) {
			this.showStatus('Playlist is empty! Add some tracks first.', 'error');
			setTimeout(() => this.hideStatus(), 3000);
			return;
		}
		
		// Show the form
		this.saveCollectionForm.style.display = 'block';
		this.saveCollectionName.value = '';
		this.saveCollectionDescription.value = '';
		this.saveCollectionName.focus();
	}
	
	hideSaveCollectionForm() {
		this.saveCollectionForm.style.display = 'none';
		this.saveCollectionName.value = '';
		this.saveCollectionDescription.value = '';
	}
	
	confirmSavePlaylistAsDrawer() {
		const collectionName = this.saveCollectionName.value.trim();
		const collectionDescription = this.saveCollectionDescription.value.trim();
		
		if (!collectionName) {
			this.showStatus('Please enter a collection name!', 'error');
			setTimeout(() => this.hideStatus(), 3000);
			return;
		}
		
		// Create new custom collection
		const newCollection = {
			id: `custom_${Date.now()}`,
			title: collectionName,
			description: collectionDescription,
			tracks: this.tracks.map(track => ({
				title: track.title,
				url: track.url
			}))
		};
		
		// Add to custom collections
		this.customCollections.push(newCollection);
		
		// Save to localStorage
		try {
			localStorage.setItem('customCollections', JSON.stringify(this.customCollections));
		} catch (error) {
			console.error('Error saving custom collection:', error);
			this.showStatus('Error saving collection!', 'error');
			setTimeout(() => this.hideStatus(), 3000);
			return;
		}
		
		// Hide the form
		this.hideSaveCollectionForm();
		
		// Re-render drawers to show the new collection
		this.renderDrawers();
		
		this.showStatus(`Collection "${collectionName}" saved with ${this.tracks.length} tracks!`, 'playing');
		setTimeout(() => this.hideStatus(), 3000);
	}
}

// Initialize the player
const player = new PlaylistPlayer();
