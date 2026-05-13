import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type CommandmentKey =
	| 'incitingIncident'
	| 'progressiveComplication'
	| 'crisis'
	| 'climax'
	| 'resolution';

export interface SceneRecord {
	id: string;
	title: string;
	povCharacter: string;
	location: string;
	valueShift: string;
	commandments: Record<CommandmentKey, string>;
	folderId: string;
	createdAt: string;
	updatedAt: string;
}

export interface SceneState {
	scenes: SceneRecord[];
	activeSceneId: string;
	folders: { id: string; name: string }[];
	folderCollapsed?: Record<string, boolean>;
}

const storageKey = 'storygrid-scenes-v1';

function createId() {
	if (browser && typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}

	return `scene-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createBlankCommandments(): Record<CommandmentKey, string> {
	return {
		incitingIncident: '',
		progressiveComplication: '',
		crisis: '',
		climax: '',
		resolution: ''
	};
}

function createSceneRecord(overrides: Partial<SceneRecord> = {}): SceneRecord {
	const now = new Date().toISOString();

	return {
		id: overrides.id ?? createId(),
		title: overrides.title ?? 'New scene',
		povCharacter: overrides.povCharacter ?? '',
		location: overrides.location ?? '',
		valueShift: overrides.valueShift ?? 'Hope → Despair',
		commandments: {
			...createBlankCommandments(),
			...overrides.commandments
		},
		folderId: overrides.folderId ?? 'folder-uncategorized',
		createdAt: overrides.createdAt ?? now,
		updatedAt: overrides.updatedAt ?? now
	};
}

function isCommandmentKey(value: string): value is CommandmentKey {
	return (
		value === 'incitingIncident' ||
		value === 'progressiveComplication' ||
		value === 'crisis' ||
		value === 'climax' ||
		value === 'resolution'
	);
}

function normalizeScene(candidate: unknown): SceneRecord | null {
	if (!candidate || typeof candidate !== 'object') return null;

	const scene = candidate as Partial<SceneRecord> & {
		commandments?: Record<string, string>;
	};

	if (typeof scene.id !== 'string') return null;

	const commandments = createBlankCommandments();
	for (const [key, value] of Object.entries(scene.commandments ?? {})) {
		if (isCommandmentKey(key) && typeof value === 'string') {
			commandments[key] = value;
		}
	}

	return createSceneRecord({
		id: scene.id,
		title: typeof scene.title === 'string' && scene.title.trim() ? scene.title : 'New scene',
		povCharacter: typeof scene.povCharacter === 'string' ? scene.povCharacter : '',
		location: typeof scene.location === 'string' ? scene.location : '',
		valueShift: typeof scene.valueShift === 'string' ? scene.valueShift : 'Hope → Despair',
		commandments,
		folderId: typeof scene['folderId'] === 'string' ? scene['folderId'] : undefined,
		createdAt: typeof scene.createdAt === 'string' ? scene.createdAt : undefined,
		updatedAt: typeof scene.updatedAt === 'string' ? scene.updatedAt : undefined
	});
}

function loadState(): SceneState {
	if (!browser) {
		const scene = createSceneRecord();
		return {
			scenes: [scene],
			activeSceneId: scene.id,
			folders: [{ id: 'folder-uncategorized', name: 'Unsorted' }]
		};
	}

	try {
		const raw = localStorage.getItem(storageKey);
		if (!raw) throw new Error('No saved scenes');

		const parsed = JSON.parse(raw) as Partial<SceneState>;
		const scenes = Array.isArray(parsed.scenes)
			? parsed.scenes.map(normalizeScene).filter((scene): scene is SceneRecord => scene !== null)
			: [];


		const folders = Array.isArray((parsed as any).folders)
			? (parsed as any).folders.map((f: any) => ({ id: String(f.id), name: String(f.name) }))
			: [];

		// ensure at least one folder
		if (folders.length === 0) {
			folders.push({ id: 'folder-uncategorized', name: 'Unsorted' });
		}

		// assign folderId for scenes missing it
		const normalizedScenes = scenes.map((s) => ({ ...s, folderId: s.folderId ?? 'folder-uncategorized' }));

		// load folderCollapsed map if present
		const folderCollapsedRaw = (parsed as any).folderCollapsed ?? {};
		const folderCollapsed: Record<string, boolean> = {};
		for (const [k, v] of Object.entries(folderCollapsedRaw)) {
			folderCollapsed[String(k)] = Boolean(v);
		}

		if (normalizedScenes.length === 0) throw new Error('No valid scenes');

		const activeSceneId =
			typeof parsed.activeSceneId === 'string' && normalizedScenes.some((scene) => scene.id === parsed.activeSceneId)
				? parsed.activeSceneId
				: normalizedScenes[0].id;

		return { scenes: normalizedScenes, activeSceneId, folders, folderCollapsed };
	} catch {
		const scene = createSceneRecord();
		return {
			scenes: [scene],
			activeSceneId: scene.id,
			folders: [{ id: 'folder-uncategorized', name: 'Unsorted' }],
			folderCollapsed: {}
		};
	}
}

function saveState(state: SceneState) {
	if (!browser) return;
	localStorage.setItem(storageKey, JSON.stringify(state));
}

function insertSceneAtIndex(scenes: SceneRecord[], scene: SceneRecord, index: number) {
	const nextScenes = [...scenes];
	nextScenes.splice(index, 0, scene);
	return nextScenes;
}

function updateScene(state: SceneState, sceneId: string, updater: (scene: SceneRecord) => SceneRecord): SceneState {
	const scenes = state.scenes.map((scene) => (scene.id === sceneId ? updater(scene) : scene));
	const activeSceneExists = scenes.some((scene) => scene.id === state.activeSceneId);

	return {
		scenes,
		activeSceneId: activeSceneExists ? state.activeSceneId : scenes[0]?.id ?? ''
		,
		folders: state.folders,
		folderCollapsed: state.folderCollapsed ?? {}
	};
}

function moveSceneWithinFolder(state: SceneState, sceneId: string, direction: 'up' | 'down'): SceneState {
	const sceneIndex = state.scenes.findIndex((scene) => scene.id === sceneId);
	if (sceneIndex === -1) return state;

	const currentScene = state.scenes[sceneIndex];
	const step = direction === 'up' ? -1 : 1;
	let neighborIndex = sceneIndex + step;

	while (neighborIndex >= 0 && neighborIndex < state.scenes.length) {
		if (state.scenes[neighborIndex].folderId === currentScene.folderId) {
			const scenes = [...state.scenes];
			[scenes[sceneIndex], scenes[neighborIndex]] = [scenes[neighborIndex], scenes[sceneIndex]];
			return {
				...state,
				scenes,
				folderCollapsed: state.folderCollapsed ?? {}
			};
		}

		neighborIndex += step;
	}

	return state;
}

function insertSceneIntoFolder(state: SceneState, sceneId: string, folderId: string): SceneState {
	const currentIndex = state.scenes.findIndex((scene) => scene.id === sceneId);
	if (currentIndex === -1) return state;

	const currentScene = state.scenes[currentIndex];
	const nextScene = { ...currentScene, folderId };
	const remainingScenes = state.scenes.filter((scene) => scene.id !== sceneId);

	let insertIndex = remainingScenes.length;
	for (let index = 0; index < remainingScenes.length; index += 1) {
		if (remainingScenes[index].folderId === folderId) {
			insertIndex = index + 1;
		}
	}

	const scenes = insertSceneAtIndex(remainingScenes, nextScene, insertIndex);

	return {
		...state,
		scenes,
		folderCollapsed: state.folderCollapsed ?? {}
	};
}

function createSceneStore() {
	const { subscribe, set, update } = writable<SceneState>(loadState());

	if (browser) {
		subscribe((value) => saveState(value));
	}

	return {
		subscribe,
		createScene: () =>
			update((state) => {
				const scene = createSceneRecord({ title: `Scene ${state.scenes.length + 1}` });
				return {
					scenes: [scene, ...state.scenes],
					activeSceneId: scene.id,
					folders: state.folders,
					folderCollapsed: state.folderCollapsed ?? {}
				};
			}),
		loadScene: (sceneId: string) =>
			update((state) => ({
				...state,
				activeSceneId: state.scenes.some((scene) => scene.id === sceneId) ? sceneId : state.activeSceneId
			})),
		createFolder: (name: string) =>
			update((state) => {
				const id = `folder-${Date.now().toString(36)}`;
				return { ...state, folders: [{ id, name }, ...state.folders], folderCollapsed: { ...(state.folderCollapsed ?? {}), [id]: false } };
			}),
		renameFolder: (folderId: string, name: string) =>
			update((state) => ({ ...state, folders: state.folders.map((f) => (f.id === folderId ? { ...f, name } : f)) })),
		deleteFolder: (folderId: string) =>
			update((state) => {
				const target = state.folders.find((f) => f.id === folderId);
				if (!target) return state;
				const defaultId = state.folders[0]?.id ?? 'folder-uncategorized';
				const scenes = state.scenes.map((s) => (s.folderId === folderId ? { ...s, folderId: defaultId } : s));
				const folders = state.folders.filter((f) => f.id !== folderId);
				const fc = { ...(state.folderCollapsed ?? {}) };
				delete fc[folderId];
				return { ...state, scenes, folders, folderCollapsed: fc };
			}),
		toggleFolderCollapse: (folderId: string) =>
			update((state) => {
				const fc = { ...(state.folderCollapsed ?? {}) };
				fc[folderId] = !fc[folderId];
				return { ...state, folderCollapsed: fc };
			}),
		moveSceneToFolder: (sceneId: string, folderId: string) =>
			update((state) => insertSceneIntoFolder(state, sceneId, folderId)),
		moveScene: (sceneId: string, direction: 'up' | 'down') =>
			update((state) => moveSceneWithinFolder(state, sceneId, direction)),
		updateSceneMeta: (sceneId: string, field: 'title' | 'povCharacter' | 'location' | 'valueShift', value: string) =>
			update((state) =>
				updateScene(state, sceneId, (scene) => ({
					...scene,
					[field]: value,
					updatedAt: new Date().toISOString()
				}))
			),
		updateCommandment: (sceneId: string, key: CommandmentKey, value: string) =>
			update((state) =>
				updateScene(state, sceneId, (scene) => ({
					...scene,
					commandments: {
						...scene.commandments,
						[key]: value
					},
					updatedAt: new Date().toISOString()
				}))
			),
		reset: () => set(loadState()),
		deleteScene: (sceneId: string) =>
			update((state) => {
				const scenes = state.scenes.filter((s) => s.id !== sceneId);
				const activeSceneId = state.activeSceneId === sceneId ? scenes[0]?.id ?? '' : state.activeSceneId;
				return {
					scenes,
					activeSceneId,
					folders: state.folders,
					folderCollapsed: state.folderCollapsed ?? {}
				};
			})
	};
}

export const scenesStore = createSceneStore();