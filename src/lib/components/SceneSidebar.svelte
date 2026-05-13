<script lang="ts">
	import type { SceneRecord } from '$lib/stores/SceneStore';

	interface Props {
		scenes: SceneRecord[];
		folders: { id: string; name: string }[];
		activeSceneId: string;
		onCreateScene: () => void;
		onLoadScene: (sceneId: string) => void;
		onMoveScene: (sceneId: string, direction: 'up' | 'down') => void;
		onRequestDelete: (sceneId: string) => void;
		onCreateFolder: () => void;
		folderCollapsed: Record<string, boolean>;
		onToggleFolderCollapse: (folderId: string) => void;
	}

	let { scenes, folders, activeSceneId, onCreateScene, onLoadScene, onMoveScene, onRequestDelete, onCreateFolder, folderCollapsed, onToggleFolderCollapse }: Props = $props();
</script>

<div class="flex h-full flex-col gap-4">
	<div>
		<p class="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">Scenes</p>
		<h2 class="mt-2 font-serif text-2xl font-semibold text-stone-950">Workspace</h2>
		<p class="mt-2 text-sm leading-6 text-stone-600">
			Save and switch between scenes without leaving the editor.
		</p>
	</div>

	<div class="flex gap-2">
		<button
			type="button"
			onclick={onCreateScene}
			class="rounded-2xl border border-stone-300 bg-stone-900 px-4 py-3 text-left text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-stone-800"
		>
			New scene
		</button>
		<button
			type="button"
			onclick={onCreateFolder}
			class="rounded-2xl border border-stone-300 bg-white px-3 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
		>
			+ Folder
		</button>
	</div>

	<div class="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
		{#each folders as folder}
			<div class="mt-2">
				<div class="mb-2 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<button type="button" onclick={() => onToggleFolderCollapse(folder.id)} class="rounded-full p-1 text-stone-500 hover:bg-stone-100">
							{#if folderCollapsed[folder.id]}
								▸
							{:else}
								▾
							{/if}
						</button>
						<div class="text-xs uppercase tracking-[0.2em] text-stone-400">{folder.name}</div>
					</div>
				</div>

				{#if !folderCollapsed[folder.id]}
					<div class="space-y-2">
						{#each scenes.filter((s) => s.folderId === folder.id) as scene, index}
							<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => onLoadScene(scene.id)}
								class:active={scene.id === activeSceneId}
								class="flex-1 rounded-2xl border px-4 py-4 text-left transition"
							>
								<div class="flex items-start justify-between gap-3">
									<div>
										<div class="text-xs uppercase tracking-[0.2em] text-stone-400">Scene</div>
										<div class="mt-1 font-medium text-stone-950">{scene.title}</div>
										<p class="mt-1 text-xs leading-5 text-stone-500">
											{scene.povCharacter || 'POV character unset'}
										</p>
									</div>
									<span class="rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.2em]">
										{scene.location ? 'Loaded' : 'Draft'}
									</span>
								</div>
							</button>
							<div class="flex flex-col gap-1">
								<button
									type="button"
									onclick={() => onMoveScene(scene.id, 'up')}
									disabled={index === 0}
									class="rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-500 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-30"
									aria-label={`Move ${scene.title} up`}
								>
									↑
								</button>
								<button
									type="button"
									onclick={() => onMoveScene(scene.id, 'down')}
									disabled={index === scenes.filter((s) => s.folderId === folder.id).length - 1}
									class="rounded-full border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-500 transition hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-30"
									aria-label={`Move ${scene.title} down`}
								>
									↓
								</button>
							</div>
						</div>
					{/each}
				</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	button.active {
		border-color: rgba(180, 94, 94, 0.9);
		background: rgb(245 245 244 / 0.9);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 10px 30px rgba(87, 68, 28, 0.06);
	}
</style>