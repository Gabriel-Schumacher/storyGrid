<script lang="ts">
	import { browser } from '$app/environment';
	import CommandmentCard from '$lib/components/CommandmentCard.svelte';
	import SceneMetadata from '$lib/components/SceneMetadata.svelte';
	import SceneSidebar from '$lib/components/SceneSidebar.svelte';
	import Timeline from '$lib/components/Timeline.svelte';
	import {
		scenesStore,
		type CommandmentKey,
		type SceneRecord
	} from '$lib/stores/SceneStore';
	import { writable } from 'svelte/store';

	const commandmentOrder: CommandmentKey[] = [
		'incitingIncident',
		'progressiveComplication',
		'crisis',
		'climax',
		'resolution'
	];

	const commandmentCopy: Record<
		CommandmentKey,
		{ title: string; hint: string; guidance: string; placeholder: string; minLength: number }
	> = {
		incitingIncident: {
			title: 'Inciting Incident',
			hint: 'Introduce the disturbance that breaks the scene’s balance.',
			guidance: 'This should create a problem that leads to the next section.',
			placeholder: 'What happens that changes the scene and forces action?',
			minLength: 40
		},
		progressiveComplication: {
			title: 'Progressive Complication / Turning Point',
			hint: 'Pressure rises as the character meets resistance, consequences, or new information.',
			guidance: 'Each beat should make the next choice harder, not easier.',
			placeholder: 'How does the situation get worse or more complex?',
			minLength: 45
		},
		crisis: {
			title: 'Crisis',
			hint: 'Force the character into a real dilemma with no clean answer.',
			guidance: 'Does this force a real dilemma?',
			placeholder: 'What impossible choice or question must be faced?',
			minLength: 35
		},
		climax: {
			title: 'Climax',
			hint: 'Show the character making a choice or taking an action to resolve the crisis.',
			guidance: 'The climax should answer the crisis with decisive action.',
			placeholder: 'What decisive action or answer resolves the tension?',
			minLength: 35
		},
		resolution: {
			title: 'Resolution',
			hint: 'Reveal the new value state and the emotional or practical aftermath.',
			guidance: 'Land the scene on the new value shift so the outcome feels earned.',
			placeholder: 'How does the world feel now that the scene is over?',
			minLength: 35
		}
	};

	const uiState = writable({
		previewMode: false,
		focusedCommandment: null as CommandmentKey | null,
		collapsedSteps: {
			incitingIncident: false,
			progressiveComplication: false,
			crisis: false,
			climax: false,
			resolution: false
		} as Record<CommandmentKey, boolean>
		,deletingSceneId: null as string | null
	});

	let mobileSidebarOpen = $state(false);

	let sceneState = $derived($scenesStore);
	let activeScene = $derived(
		sceneState.scenes.find((scene) => scene.id === sceneState.activeSceneId) ?? sceneState.scenes[0]
	);
	let commandmentProgress = $derived(
		commandmentOrder.reduce((count, key) => count + (isComplete(activeScene, key) ? 1 : 0), 0)
	);
	let activeIndex = $derived(determineActiveIndex(activeScene, $uiState.focusedCommandment));

	function isComplete(scene: SceneRecord | undefined, key: CommandmentKey) {
		if (!scene) return false;
		return scene.commandments[key].trim().length >= commandmentCopy[key].minLength;
	}

	function determineActiveIndex(scene: SceneRecord | undefined, focus: CommandmentKey | null) {
		if (focus) {
			return commandmentOrder.indexOf(focus);
		}

		if (!scene) return 0;

		const firstIncomplete = commandmentOrder.findIndex((key) => !isComplete(scene, key));
		return firstIncomplete === -1 ? commandmentOrder.length - 1 : firstIncomplete;
	}

	function focusCommandment(key: CommandmentKey) {
		uiState.update((state) => ({ ...state, focusedCommandment: key }));
		if (browser) {
			const element = document.getElementById(`commandment-${key}`);
			element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	function updateMeta(field: 'title' | 'povCharacter' | 'location' | 'valueShift', value: string) {
		if (!activeScene) return;
		scenesStore.updateSceneMeta(activeScene.id, field, value);
	}

	function updateCommandment(key: CommandmentKey, value: string) {
		if (!activeScene) return;
		scenesStore.updateCommandment(activeScene.id, key, value);
	}

	function createNewScene() {
		scenesStore.createScene();
		uiState.update((state) => ({ ...state, focusedCommandment: null }));
		mobileSidebarOpen = false;
	}

	function loadScene(sceneId: string) {
		scenesStore.loadScene(sceneId);
		uiState.update((state) => ({ ...state, focusedCommandment: null }));
		mobileSidebarOpen = false;
	}

	function toggleCollapsed(key: CommandmentKey) {
		uiState.update((state) => ({
			...state,
			collapsedSteps: {
				...state.collapsedSteps,
				[key]: !state.collapsedSteps[key]
			}
		}));
	}

	function requestDelete(sceneId: string) {
		uiState.update((s) => ({ ...s, deletingSceneId: sceneId }));
	}

	function cancelDelete() {
		uiState.update((s) => ({ ...s, deletingSceneId: null }));
	}

	import { get } from 'svelte/store';

	function confirmDelete() {
		const id = get(uiState).deletingSceneId;
		if (!id) return;
		scenesStore.deleteScene(id);
		uiState.update((s) => ({ ...s, deletingSceneId: null }));
	}

	function createFolder() {
		const name = prompt('Folder name');
		if (name && name.trim()) scenesStore.createFolder(name.trim());
	}

	function toggleFolderCollapse(folderId: string) {
		scenesStore.toggleFolderCollapse(folderId);
	}

	function moveSceneToFolder(sceneId: string, folderId: string) {
		scenesStore.moveSceneToFolder(sceneId, folderId);
	}

	function moveScene(sceneId: string, direction: 'up' | 'down') {
		scenesStore.moveScene(sceneId, direction);
	}

	function openMobileSidebar() {
		mobileSidebarOpen = true;
	}

	function closeMobileSidebar() {
		mobileSidebarOpen = false;
	}

	function summaryParagraph(scene: SceneRecord) {
		const inciting = scene.commandments.incitingIncident.trim();
		const complication = scene.commandments.progressiveComplication.trim();
		const crisis = scene.commandments.crisis.trim();
		const climax = scene.commandments.climax.trim();
		const resolution = scene.commandments.resolution.trim();

		return `${scene.title || 'This scene'} follows ${scene.povCharacter || 'the POV character'} in ${scene.location || 'the current location'} as ${inciting || 'the disturbance begins'}. Pressure escalates when ${complication || 'new complications appear'}, forcing a crisis around ${crisis || 'an impossible choice'}. The scene lands on ${climax || 'a decisive action'} and resolves into ${resolution || 'a new emotional state'} through a ${scene.valueShift || 'meaningful value shift'}.`;
	}
</script>

<svelte:head>
	<title>Story Grid Scene Builder</title>
	<meta
		name="description"
		content="A clean SvelteKit scene-building workspace inspired by Story Grid’s 5 Commandments."
	/>
</svelte:head>

<div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(225,214,194,0.36),_transparent_34%),linear-gradient(180deg,_#f6f0e6_0%,_#f5efe4_35%,_#efe7da_100%)] text-stone-900">
	<div class="mx-auto flex min-h-screen max-w-[1800px] gap-5 px-4 py-4 lg:px-6">
		<aside class="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 rounded-3xl border border-stone-300/70 bg-white/80 p-4 shadow-[0_18px_60px_rgba(88,64,28,0.08)] backdrop-blur xl:block">
			<SceneSidebar
				scenes={sceneState.scenes}
				folders={sceneState.folders}
				activeSceneId={sceneState.activeSceneId}
				onCreateScene={createNewScene}
				onLoadScene={loadScene}
					onMoveScene={moveScene}
				onRequestDelete={requestDelete}
				onCreateFolder={createFolder}
				folderCollapsed={sceneState.folderCollapsed ?? {}}
				onToggleFolderCollapse={toggleFolderCollapse}
			/>
		</aside>

		{#if mobileSidebarOpen}
			<div class="fixed inset-0 z-50 xl:hidden">
				<button
					type="button"
					class="absolute inset-0 bg-black/40"
					onclick={closeMobileSidebar}
					aria-label="Close scenes drawer"
				></button>
				<div class="absolute inset-0 bg-[#f7f2e8] shadow-2xl">
					<div class="flex h-full flex-col">
						<div class="flex items-center justify-between border-b border-stone-200 px-4 py-4">
							<div>
								<p class="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">Scenes</p>
								<p class="mt-1 font-serif text-xl font-semibold text-stone-950">Workspace</p>
							</div>
							<button
								type="button"
								onclick={closeMobileSidebar}
								class="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700"
							>
								Close
							</button>
						</div>
						<div class="min-h-0 flex-1 overflow-y-auto p-4">
							<SceneSidebar
								scenes={sceneState.scenes}
								folders={sceneState.folders}
								activeSceneId={sceneState.activeSceneId}
								onCreateScene={createNewScene}
								onLoadScene={loadScene}
								onMoveScene={moveScene}
								onRequestDelete={requestDelete}
								onCreateFolder={createFolder}
								folderCollapsed={sceneState.folderCollapsed ?? {}}
								onToggleFolderCollapse={toggleFolderCollapse}
								onClose={closeMobileSidebar}
							/>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<main class="flex min-h-screen flex-1 flex-col gap-5">
			<header class="rounded-[2rem] border border-stone-300/70 bg-white/85 px-5 py-4 shadow-[0_18px_60px_rgba(88,64,28,0.08)] backdrop-blur">
				<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div class="space-y-2">
						<p class="text-xs font-semibold uppercase tracking-[0.35em] red-color">
							Story Grid Scene Builder
						</p>
						<h1 class="font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
							Build a scene with clear cause and effect
						</h1>
						<p class="max-w-3xl text-sm leading-6 text-stone-600 sm:text-base">
							Structure the Inciting Incident, Progressive Complication, Crisis, Climax, and Resolution
							so each beat pushes the next one forward.
						</p>
					</div>

					<div class="flex flex-wrap items-center gap-3">
						<button
							type="button"
							onclick={openMobileSidebar}
							class="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:-translate-y-0.5 hover:bg-stone-100 xl:hidden"
						>
							Scenes & folders
						</button>
						<div class="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
							<div class="text-xs uppercase tracking-[0.25em] text-stone-400">Progress</div>
							<div class="mt-1 text-base font-semibold text-stone-900">
								{commandmentProgress}/5 completed
							</div>
						</div>
						<button
							type="button"
							onclick={createNewScene}
							class="rounded-2xl border border-stone-300 bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-stone-800"
						>
							New scene
						</button>
						<button
							type="button"
							onclick={() =>
								uiState.update((state) => ({ ...state, previewMode: !state.previewMode }))}
							class="rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition hover:-translate-y-0.5 hover:bg-stone-100"
						>
							{$uiState.previewMode ? 'Hide preview' : 'Preview mode'}
						</button>
					</div>
				</div>
			</header>

			<section class="rounded-[2rem] border border-stone-300/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(88,64,28,0.08)] backdrop-blur">
				<SceneMetadata scene={activeScene} folders={sceneState.folders} onUpdateMeta={updateMeta} onMoveFolder={moveSceneToFolder} />
			</section>

			<div class="grid flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
				<section class="rounded-[2rem] border border-stone-300/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(88,64,28,0.08)] backdrop-blur">
					<div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div>
							<h2 class="font-serif text-2xl font-semibold text-stone-950">5 Commandments Scene Flow</h2>
							<p class="mt-1 max-w-2xl text-sm leading-6 text-stone-600">
								Write each beat so it naturally causes the next. The timeline stays active as you move through the scene.
							</p>
						</div>
						<div class="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
							Current focus: <span class="font-semibold text-stone-900">{commandmentCopy[commandmentOrder[activeIndex]]?.title ?? 'Inciting Incident'}</span>
						</div>
					</div>

					<div class="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
						<div class="xl:sticky xl:top-5 xl:h-fit">
							<Timeline
								steps={commandmentOrder.map((key, index) => ({
									key,
									title: commandmentCopy[key].title,
									active: index === activeIndex,
									completed: isComplete(activeScene, key)
								}))}
								onJumpToStep={focusCommandment}
							/>
						</div>

						<div class="space-y-5">
							{#each commandmentOrder as key, index}
								<CommandmentCard
									id={`commandment-${key}`}
									title={commandmentCopy[key].title}
									hint={commandmentCopy[key].hint}
									guidance={commandmentCopy[key].guidance}
									value={activeScene?.commandments[key] ?? ''}
									placeholder={commandmentCopy[key].placeholder}
									active={index === activeIndex}
									completed={isComplete(activeScene, key)}
									collapsed={$uiState.collapsedSteps[key]}
									warning={
										(activeScene?.commandments[key] ?? '').trim().length > 0 &&
										(activeScene?.commandments[key] ?? '').trim().length < commandmentCopy[key].minLength
											? `This beat is still short. Expand it so it can clearly drive ${
												commandmentOrder[index + 1]
													? commandmentCopy[commandmentOrder[index + 1]].title.toLowerCase()
													: 'the resolution'
												}.`
											: ''
									}
									onFocus={() => focusCommandment(key)}
									onToggleCollapse={() => toggleCollapsed(key)}
									onValueChange={(value) => updateCommandment(key, value)}
								/>
							{/each}

							<div class="mt-6 flex items-center justify-end">
								<button
									type="button"
									onclick={() => requestDelete(sceneState.activeSceneId)}
									class="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
									aria-label="Delete current scene"
								>
									Delete scene
								</button>
							</div>
						</div>
					</div>
				</section>

				<aside class="space-y-5">
					<div class="rounded-[2rem] border border-stone-300/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(88,64,28,0.08)] backdrop-blur">
						<h2 class="font-serif text-xl font-semibold text-stone-950">Scene Map</h2>
						<p class="mt-2 text-sm leading-6 text-stone-600">
							Keep the cause-and-effect chain tight. If a beat does not pressure the next one, revise it until it does.
						</p>
						<div class="mt-4 space-y-3 text-sm">
							<div class="rounded-2xl border border-stone-200 bg-stone-50 p-4">
								<div class="text-xs uppercase tracking-[0.2em] text-stone-400">Cause</div>
								<p class="mt-1 text-stone-700">
									The Inciting Incident should disturb the scene’s balance and start the chain.
								</p>
							</div>
							<div class="rounded-2xl border border-stone-200 bg-stone-50 p-4">
								<div class="text-xs uppercase tracking-[0.2em] text-stone-400">Pressure</div>
								<p class="mt-1 text-stone-700">
									Progressive Complication should narrow the options until the Crisis becomes unavoidable.
								</p>
							</div>
							<div class="rounded-2xl border border-stone-200 bg-stone-50 p-4">
								<div class="text-xs uppercase tracking-[0.2em] text-stone-400">Resolution</div>
								<p class="mt-1 text-stone-700">
									A strong Resolution clarifies the new value shift so the reader feels the scene has landed.
								</p>
							</div>
						</div>
					</div>

					<div class="rounded-[2rem] border border-stone-300/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(88,64,28,0.08)] backdrop-blur">
						<div class="flex items-center justify-between gap-3">
							<h2 class="font-serif text-xl font-semibold text-stone-950">Preview</h2>
							<span class="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
								{$uiState.previewMode ? 'On' : 'Off'}
							</span>
						</div>
						{#if $uiState.previewMode && activeScene}
							<p class="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700">
								{summaryParagraph(activeScene)}
							</p>
						{:else}
							<p class="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm leading-6 text-stone-500">
								Toggle Preview mode to turn the scene notes into a readable paragraph.
							</p>
						{/if}
					</div>
				</aside>
			</div>
		</main>
	</div>
</div>

{#if $uiState.deletingSceneId}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
		<div class="w-[min(640px,90%)] rounded-2xl bg-white p-6 shadow-2xl">
			<h3 class="text-lg font-semibold text-stone-900">Delete scene?</h3>
			<p class="mt-3 text-sm text-stone-600">
				This action will permanently delete the scene. This is a second confirmation to prevent accidental deletions.
			</p>
			<p class="mt-4 text-sm text-stone-700">Are you sure you want to delete <strong>{get(scenesStore).scenes.find((s: SceneRecord) => s.id === $uiState.deletingSceneId)?.title ?? 'this scene'}</strong>?</p>
			<div class="mt-6 flex justify-end gap-3">
				<button onclick={cancelDelete} class="rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700">Cancel</button>
				<button onclick={confirmDelete} class="rounded-2xl border border-rose-400 bg-rose-600 px-4 py-2 text-sm font-semibold text-white">Delete permanently</button>
			</div>
		</div>
	</div>
{/if}
