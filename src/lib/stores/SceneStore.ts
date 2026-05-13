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
	createdAt: string;
	updatedAt: string;
}

export interface SceneState {
	scenes: SceneRecord[];
	activeSceneId: string;
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
		createdAt: typeof scene.createdAt === 'string' ? scene.createdAt : undefined,
		updatedAt: typeof scene.updatedAt === 'string' ? scene.updatedAt : undefined
	});
}

function loadState(): SceneState {
	if (!browser) {
		const scene = createSceneRecord();
		return {
			scenes: [scene],
			activeSceneId: scene.id
		};
	}

	try {
		const raw = localStorage.getItem(storageKey);
		if (!raw) throw new Error('No saved scenes');

		const parsed = JSON.parse(raw) as Partial<SceneState>;
		const scenes = Array.isArray(parsed.scenes)
			? parsed.scenes.map(normalizeScene).filter((scene): scene is SceneRecord => scene !== null)
			: [];

		if (scenes.length === 0) throw new Error('No valid scenes');

		const activeSceneId =
			typeof parsed.activeSceneId === 'string' && scenes.some((scene) => scene.id === parsed.activeSceneId)
				? parsed.activeSceneId
				: scenes[0].id;

		return { scenes, activeSceneId };
	} catch {
		const scene = createSceneRecord();
		return {
			scenes: [scene],
			activeSceneId: scene.id
		};
	}
}

function saveState(state: SceneState) {
	if (!browser) return;
	localStorage.setItem(storageKey, JSON.stringify(state));
}

function updateScene(state: SceneState, sceneId: string, updater: (scene: SceneRecord) => SceneRecord): SceneState {
	const scenes = state.scenes.map((scene) => (scene.id === sceneId ? updater(scene) : scene));
	const activeSceneExists = scenes.some((scene) => scene.id === state.activeSceneId);

	return {
		scenes,
		activeSceneId: activeSceneExists ? state.activeSceneId : scenes[0]?.id ?? ''
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
					activeSceneId: scene.id
				};
			}),
		loadScene: (sceneId: string) =>
			update((state) => ({
				...state,
				activeSceneId: state.scenes.some((scene) => scene.id === sceneId) ? sceneId : state.activeSceneId
			})),
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
				return { scenes, activeSceneId };
			})
	};
}

export const scenesStore = createSceneStore();