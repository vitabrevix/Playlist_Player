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
		this.initialize();
	}
	
	async initialize() {
		await this.loadCollections();
		this.loadFromStorage();
		this.handleUrlParameters();
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
		this.shareBtn = document.getElementById('shareBtn');
		this.importFile = document.getElementById('importFile');
		this.drawersContainer = document.getElementById('drawers-container');
		this.createDrawerBtn = document.getElementById('createDrawerBtn');
		this.subjectTypeFilter = document.getElementById('subjectTypeFilter');
		this.hypnotistTypeFilter = document.getElementById('hypnotistTypeFilter');
		
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
		
		// Share dialog elements
		this.shareDialog = document.getElementById('shareDialog');
		this.shareUrlInput = document.getElementById('shareUrlInput');
		this.shareCopyBtn = document.getElementById('shareCopyBtn');
		this.shareCloseBtn = document.getElementById('shareCloseBtn');
		this.shareShuffleCheck = document.getElementById('shareShuffleCheck');
		this.shareLoopCheck = document.getElementById('shareLoopCheck');
		this.shareAutoShuffleCheck = document.getElementById('shareAutoShuffleCheck');
		this.shareClearCheck = document.getElementById('shareClearCheck');
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
		
		if (this.shareBtn) {
			this.shareBtn.addEventListener('click', () => this.showShareDialog());
		}
		
		if (this.shareCopyBtn) {
			this.shareCopyBtn.addEventListener('click', () => this.copyShareUrl());
		}
		
		if (this.shareCloseBtn) {
			this.shareCloseBtn.addEventListener('click', () => this.hideShareDialog());
		}
		
		// Update share URL when checkboxes change
		if (this.shareShuffleCheck) {
			this.shareShuffleCheck.addEventListener('change', () => this.updateShareUrl());
		}
		if (this.shareLoopCheck) {
			this.shareLoopCheck.addEventListener('change', () => this.updateShareUrl());
		}
		if (this.shareAutoShuffleCheck) {
			this.shareAutoShuffleCheck.addEventListener('change', () => this.updateShareUrl());
		}
		if (this.shareClearCheck) {
			this.shareClearCheck.addEventListener('change', () => this.updateShareUrl());
		}
		
		this.importFile.addEventListener('change', (e) => this.importPlaylist(e));
		
		this.createDrawerBtn.addEventListener('click', () => this.toggleCollectionForm());
		this.saveCollectionBtn.addEventListener('click', () => this.saveNewCollection());
		this.cancelCollectionBtn.addEventListener('click', () => this.hideCollectionForm());
		
		// Subject type filter listener
		if (this.subjectTypeFilter) {
			this.subjectTypeFilter.addEventListener('change', () => this.filterDrawersBySubjectType());
		}
		
		// Hypnotist type filter listener
		if (this.hypnotistTypeFilter) {
			this.hypnotistTypeFilter.addEventListener('change', () => this.filterDrawersBySubjectType());
		}
		
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
									url: track.url,
									subjectType: track.subjectType, // Preserve subjectType
									hypnotistType: track.hypnotistType // Preserve hypnotistType
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
		
		// Apply current filter if set
		this.filterDrawersBySubjectType();
	}
	
	filterDrawersBySubjectType() {
		if (!this.subjectTypeFilter || !this.hypnotistTypeFilter) return;
		
		const selectedSubjectType = this.subjectTypeFilter.value;
		const selectedHypnotistType = this.hypnotistTypeFilter.value;
		const allDrawers = this.drawersContainer.querySelectorAll('.drawer');
		
		allDrawers.forEach(drawer => {
			const drawerId = drawer.dataset.drawerId;
			
			// Find the collection
			let collection = this.collections.find(c => c.id === drawerId);
			if (!collection) {
				collection = this.customCollections.find(c => c.id === drawerId);
			}
			
			if (!collection) return;
			
			// Get all drawer items in this collection
			const drawerItems = drawer.querySelectorAll('.drawer-item');
			let visibleCount = 0;
			
			drawerItems.forEach((item, index) => {
				const track = collection.tracks[index];
				
				if (!track) return;
				
				// Check subject type filter
				let subjectMatch = false;
				if (selectedSubjectType === 'any') {
					subjectMatch = true;
				} else if (!track.subjectType) {
					// Always show unmarked tracks
					subjectMatch = true;
				} else if (track.subjectType === selectedSubjectType) {
					subjectMatch = true;
				}
				
				// Check hypnotist type filter
				let hypnotistMatch = false;
				if (selectedHypnotistType === 'any') {
					hypnotistMatch = true;
				} else if (!track.hypnotistType) {
					// Always show unmarked tracks
					hypnotistMatch = true;
				} else if (track.hypnotistType === selectedHypnotistType) {
					hypnotistMatch = true;
				}
				
				// Show track only if both filters match
				if (subjectMatch && hypnotistMatch) {
					item.style.display = '';
					visibleCount++;
				} else {
					item.style.display = 'none';
				}
			});
			
			// Update the track count in the drawer header
			const countElement = drawer.querySelector('.drawer-count');
			if (countElement) {
				countElement.textContent = `(${visibleCount} tracks)`;
			}
			
			// Hide the entire drawer if no tracks are visible
			if (visibleCount === 0) {
				drawer.style.display = 'none';
			} else {
				drawer.style.display = '';
			}
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
	
	handleUrlParameters() {
		try {
			// Parse URL parameters
			const urlParams = new URLSearchParams(window.location.search);
			let shouldShuffle = false;
			let loopMode = null;
			let encodedPlaylist = null;
			let autoShuffleOn = false;
			
			// Check for clear parameter (?clear=true clears playlist, ?clear=false or absent appends)
			const clearParam = urlParams.get('clear');
			const shouldClear = clearParam !== null && clearParam.toLowerCase() === 'true';
			
			// If clear=true, wipe the current playlist before loading URL tracks
			if (shouldClear) {
				this.tracks = [];
				this.currentIndex = 0;
				this.audioPlayer.pause();
				this.audioPlayer.src = '';
				this.renderPlaylist();
				this.saveToStorage();
			}
			
			// Check for collection number parameters (1, 2, 3, etc.)
			for (let [key, value] of urlParams.entries()) {
				// Check for encoded playlist parameter
				if (key.toLowerCase() === 'p') {
					encodedPlaylist = value;
					continue;
				}
				
				// Check if it's a number parameter
				const collectionNumber = parseInt(key);
				if (!isNaN(collectionNumber) && collectionNumber > 0) {
					// Convert to 0-based index
					const collectionIndex = collectionNumber - 1;
					
					// Check if collection exists
					if (collectionIndex < this.collections.length) {
						const collection = this.collections[collectionIndex];
						const collectionId = collection.id;
						
						// Add all tracks from this collection
						this.addAllTracksFromDrawer(collectionId);
					}
				}
				
				// Check for shuffle parameter
				if (key.toLowerCase() === 'shuffle') {
					shouldShuffle = true;
				}
				
				// Check for autoshuffle parameter
				if (key.toLowerCase() === 'autoshuffle') {
					autoShuffleOn = true;
				}
				
				// Check for loop parameter (loop=off, loop=current, loop=all)
				if (key.toLowerCase() === 'loop') {
					const loopValue = value.toLowerCase();
					if (loopValue === 'off' || loopValue === 'current' || loopValue === 'all') {
						loopMode = loopValue;
					}
				}
			}
			
			// Decode and add tracks from encoded playlist
			if (encodedPlaylist) {
				const binaryString = this.alphabetToBinary(encodedPlaylist);
				let bitIndex = 0;
				
				// Go through all collections and their tracks
				this.collections.forEach(collection => {
					collection.tracks.forEach(track => {
						if (bitIndex < binaryString.length) {
							const shouldAdd = binaryString[bitIndex] === '1';
							if (shouldAdd) {
								// Add this specific track
								const trackToAdd = {
									title: track.title,
									url: track.url,
									subjectType: track.subjectType,
									hypnotistType: track.hypnotistType
								};
								this.tracks.push(trackToAdd);
							}
							bitIndex++;
						}
					});
				});
				
				// If tracks were added, update the UI
				if (this.tracks.length > 0) {
					this.renderPlaylist();
					this.saveToStorage();
					this.loadTrack(0);
				}
			}
			
			// Set auto-shuffle if requested
			if (autoShuffleOn) {
				this.autoShuffleEnabled = true;
				this.autoShuffleBtn.textContent = '🔄 Auto-Shuffle: ON';
				this.autoShuffleBtn.className = 'auto-shuffle-on';
				this.saveToStorage();
			}
			
			// Set loop mode if requested
			if (loopMode) {
				if (loopMode === 'off') {
					this.loopMode = 'off';
					this.loopBtn.textContent = '🔁 Loop: OFF';
					this.loopBtn.className = 'loop-off';
				} else if (loopMode === 'current') {
					this.loopMode = 'one';
					this.loopBtn.textContent = '🔂 Loop: Current Track';
					this.loopBtn.className = 'loop-one';
				} else if (loopMode === 'all') {
					this.loopMode = 'all';
					this.loopBtn.textContent = '🔁 Loop: All Tracks';
					this.loopBtn.className = 'loop-on';
				}
				this.saveToStorage();
			}
			
			// Execute shuffle if requested (after adding collections)
			if (shouldShuffle && this.tracks.length > 0) {
				// Use setTimeout to ensure tracks are added first
				setTimeout(() => {
					this.shufflePlaylist();
				}, 100);
			}
			
		} catch (error) {
			console.error('Error handling URL parameters:', error);
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
	
	// Encode binary string to alphabet characters
	binaryToAlphabet(binaryString) {
		// Split binary into chunks of 5 bits (2^5 = 32, enough for a-z + a few extras)
		const chunks = [];
		for (let i = 0; i < binaryString.length; i += 5) {
			chunks.push(binaryString.substr(i, 5));
		}
		
		// Convert each 5-bit chunk to a letter (a-z = 0-25, then A-F for 26-31)
		return chunks.map(chunk => {
			const value = parseInt(chunk.padEnd(5, '0'), 2);
			if (value < 26) {
				return String.fromCharCode(97 + value); // a-z
			} else {
				return String.fromCharCode(65 + (value - 26)); // A-F for overflow
			}
		}).join('');
	}
	
	// Decode alphabet characters to binary string
	alphabetToBinary(alphabetString) {
		return alphabetString.split('').map(char => {
			let value;
			if (char >= 'a' && char <= 'z') {
				value = char.charCodeAt(0) - 97;
			} else if (char >= 'A' && char <= 'F') {
				value = char.charCodeAt(0) - 65 + 26;
			} else {
				return '00000'; // Invalid character, treat as 0
			}
			return value.toString(2).padStart(5, '0');
		}).join('');
	}
	
	// Show share dialog
	showShareDialog() {
		if (this.tracks.length === 0) {
			this.showStatus('Playlist is empty! Add some tracks first.', 'error');
			setTimeout(() => this.hideStatus(), 3000);
			return;
		}
		
		// Reset checkboxes
		this.shareShuffleCheck.checked = false;
		this.shareLoopCheck.checked = false;
		this.shareAutoShuffleCheck.checked = false;
		this.shareClearCheck.checked = false;
		
		// Generate and display the URL
		this.updateShareUrl();
		
		// Show the dialog
		this.shareDialog.style.display = 'block';
	}
	
	// Hide share dialog
	hideShareDialog() {
		this.shareDialog.style.display = 'none';
	}
	
	// Update share URL based on checkbox states
	updateShareUrl() {
		// First, check if playlist consists of complete collections
		const collectionNumbers = this.detectCompleteCollections();
		
		let shareUrl;
		const baseUrl = window.location.origin + window.location.pathname;
		
		if (collectionNumbers.length > 0 && this.isOnlyCompleteCollections(collectionNumbers)) {
			// Use simplified ?1&2&3 format for complete collections
			const params = collectionNumbers.map(num => num.toString()).join('&');
			shareUrl = `${baseUrl}?${params}`;
		} else {
			// Use binary encoding with zeros for skipped collections
			let binaryString = '';
			
			// Go through all collections and their tracks
			this.collections.forEach((collection, collectionIndex) => {
				// Check if this entire collection is in the playlist
				const allTracksInPlaylist = collection.tracks.every(track => 
					this.tracks.some(t => t.url === track.url)
				);
				
				if (allTracksInPlaylist && collection.tracks.length > 0) {
					// Replace this collection's bits with zeros (will be added as ?number)
					binaryString += '0'.repeat(collection.tracks.length);
				} else {
					// Add individual track selections
					collection.tracks.forEach(track => {
						const isInPlaylist = this.tracks.some(t => t.url === track.url);
						binaryString += isInPlaylist ? '1' : '0';
					});
				}
			});
			
			// Convert binary to alphabet encoding
			const encoded = this.binaryToAlphabet(binaryString);
			
			// Build URL with both p= and collection numbers
			shareUrl = `${baseUrl}?p=${encoded}`;
			
			// Add collection numbers for complete collections
			collectionNumbers.forEach(num => {
				shareUrl += `&${num}`;
			});
		}
		
		// Add optional parameters based on checkboxes
		if (this.shareShuffleCheck.checked) {
			shareUrl += '&shuffle';
		}
		if (this.shareLoopCheck.checked) {
			shareUrl += '&loop=all';
		}
		if (this.shareAutoShuffleCheck.checked) {
			shareUrl += '&autoshuffle';
		}
		if (this.shareClearCheck.checked) {
			shareUrl += '&clear=true';
		}
		
		// Update the input field
		this.shareUrlInput.value = shareUrl;
	}
	
	// Detect which collections are completely included in the playlist
	detectCompleteCollections() {
		const completeCollections = [];
		
		this.collections.forEach((collection, index) => {
			if (collection.tracks.length === 0) return;
			
			// Check if ALL tracks from this collection are in the playlist
			const allTracksPresent = collection.tracks.every(track =>
				this.tracks.some(t => t.url === track.url)
			);
			
			if (allTracksPresent) {
				completeCollections.push(index + 1); // 1-based index for URL
			}
		});
		
		return completeCollections;
	}
	
	// Check if playlist contains ONLY complete collections (no partial selections)
	isOnlyCompleteCollections(collectionNumbers) {
		// Calculate total tracks from complete collections
		let totalTracksInCollections = 0;
		collectionNumbers.forEach(num => {
			const collection = this.collections[num - 1];
			if (collection) {
				totalTracksInCollections += collection.tracks.length;
			}
		});
		
		// Check if playlist has exactly these tracks (no more, no less)
		return this.tracks.length === totalTracksInCollections;
	}
	
	// Copy share URL to clipboard
	copyShareUrl() {
		const shareUrl = this.shareUrlInput.value;
		
		navigator.clipboard.writeText(shareUrl).then(() => {
			this.showStatus(`Share link copied to clipboard! (${this.tracks.length} tracks)`, 'playing');
			setTimeout(() => this.hideStatus(), 2000);
			
			// Change button text temporarily
			const originalText = this.shareCopyBtn.textContent;
			this.shareCopyBtn.textContent = '✓ Copied!';
			setTimeout(() => {
				this.shareCopyBtn.textContent = originalText;
			}, 2000);
		}).catch(err => {
			// Select the text so user can copy manually
			this.shareUrlInput.select();
			this.shareUrlInput.setSelectionRange(0, 99999); // For mobile devices
			this.showStatus('Unable to copy automatically. Text selected - press Ctrl+C', 'error');
			setTimeout(() => this.hideStatus(), 3000);
		});
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