<script lang="ts">
	import type { SceneRecord } from '$lib/stores/SceneStore';

	interface Props {
		scene: SceneRecord | undefined;
		onUpdateMeta: (field: 'title' | 'povCharacter' | 'location' | 'valueShift', value: string) => void;
		folders: { id: string; name: string }[];
		onMoveFolder: (sceneId: string, folderId: string) => void;
	}

	let { scene, onUpdateMeta, folders, onMoveFolder }: Props = $props();
</script>

<div class="space-y-5">
	<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<p class="text-xs font-semibold uppercase tracking-[0.35em] text-stone-400">Scene metadata</p>
			<h2 class="mt-2 font-serif text-2xl font-semibold text-stone-950">Top-level context</h2>
		</div>
		<div class="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
			Keep this section always visible so the scene anchor never disappears.
		</div>
	</div>

	{#if scene}
		<div class="grid gap-4 lg:grid-cols-2">
			<label class="space-y-2">
				<span class="text-sm font-medium text-stone-700">Folder</span>
				<select
					value={scene.folderId}
					onchange={(e) => onMoveFolder(scene.id, (e.currentTarget as HTMLSelectElement).value)}
					class="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-200"
				>
					{#each folders as f}
						<option value={f.id}>{f.name}</option>
					{/each}
				</select>
			</label>
			<label class="space-y-2">
				<span class="text-sm font-medium text-stone-700">Scene Title</span>
				<input
					type="text"
					value={scene.title}
					oninput={(event) =>
						onUpdateMeta('title', (event.currentTarget as HTMLInputElement).value)}
					class="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-200"
					placeholder="Enter scene title"
				/>
			</label>

			<label class="space-y-2">
				<span class="text-sm font-medium text-stone-700">POV Character</span>
				<input
					type="text"
					value={scene.povCharacter}
					oninput={(event) =>
						onUpdateMeta('povCharacter', (event.currentTarget as HTMLInputElement).value)}
					class="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-200"
					placeholder="Who owns the scene?"
				/>
			</label>

			<label class="space-y-2">
				<span class="text-sm font-medium text-stone-700">Location</span>
				<input
					type="text"
					value={scene.location}
					oninput={(event) =>
						onUpdateMeta('location', (event.currentTarget as HTMLInputElement).value)}
					class="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-200"
					placeholder="Where does the scene happen?"
				/>
			</label>

			<label class="space-y-2">
				<span class="text-sm font-medium text-stone-700">Value Shift</span>
				<input
					type="text"
					value={scene.valueShift}
					oninput={(event) =>
						onUpdateMeta('valueShift', (event.currentTarget as HTMLInputElement).value)}
					class="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-4 focus:ring-stone-200"
					placeholder="Hope → Despair"
				/>
			</label>
		</div>
	{/if}
</div>