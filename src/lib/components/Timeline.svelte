<script lang="ts">
	import type { CommandmentKey } from '$lib/stores/SceneStore';

	interface TimelineStep {
		key: CommandmentKey;
		title: string;
		active: boolean;
		completed: boolean;
	}

	interface Props {
		steps: TimelineStep[];
		onJumpToStep: (key: CommandmentKey) => void;
	}

	let { steps, onJumpToStep }: Props = $props();
</script>

<div class="rounded-3xl border border-stone-200 bg-stone-50/80 p-4">
	<div class="flex items-center justify-between gap-3">
		<div>
			<p class="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">Timeline</p>
			<h3 class="mt-2 text-base font-semibold text-stone-950">Scene progression</h3>
		</div>
		<div class="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
			5 steps
		</div>
	</div>

	<div class="relative mt-5 pl-7">
		<div class="absolute left-3.5 top-2 bottom-2 w-px bg-stone-300"></div>
		<div class="space-y-4">
			{#each steps as step}
				<button
					type="button"
					onclick={() => onJumpToStep(step.key)}
					class:active={step.active}
					class:done={step.completed}
					class="timeline-step relative block w-full rounded-2xl border border-transparent bg-transparent px-4 py-3 text-left transition"
				>
					<span class="absolute -left-7 top-4 flex h-5 w-5 items-center justify-center rounded-full border bg-white text-[10px] font-semibold transition">
						{#if step.completed}
							<span>✓</span>
						{:else}
							<span class="h-2 w-2 rounded-full bg-stone-400"></span>
						{/if}
					</span>
					<div class="text-xs uppercase tracking-[0.22em] text-stone-400">Step</div>
					<div class="mt-1 font-medium text-stone-950">{step.title}</div>
					<p class="mt-1 text-xs leading-5 text-stone-500">
						{step.active ? 'Current focus' : step.completed ? 'Completed' : 'Upcoming'}
					</p>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	button.active {
		border-color: rgb(168 162 158 / 0.7);
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(245, 245, 244, 0.95));
		box-shadow: 0 14px 28px rgba(68, 54, 22, 0.08);
	}

	button.done {
		color: rgb(87 83 78);
	}

	button.done span {
		border-color: rgb(192 132 252 / 0.25);
		background: rgb(250 250 249);
	}
</style>