<script lang="ts">
	interface Props {
		id: string;
		title: string;
		hint: string;
		guidance: string;
		value: string;
		placeholder: string;
		active: boolean;
		completed: boolean;
		collapsed: boolean;
		warning: string;
		onValueChange: (value: string) => void;
		onFocus: () => void;
		onToggleCollapse: () => void;
	}

	let {
		id,
		title,
		hint,
		guidance,
		value,
		placeholder,
		active,
		completed,
		collapsed,
		warning,
		onValueChange,
		onFocus,
		onToggleCollapse
	}: Props = $props();
</script>

<article
	id={id}
	class:active
	class:completed
	class="rounded-[1.75rem] border bg-white/90 p-4 shadow-[0_10px_34px_rgba(88,64,28,0.06)] transition duration-300"
>
	<div class="flex items-start justify-between gap-4">
		<div class="space-y-2">
			<div class="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">Commandment</div>
			<h3 class="font-serif text-2xl font-semibold text-stone-950">{title}</h3>
			<p class="max-w-3xl text-sm leading-6 text-stone-600">{hint}</p>
		</div>

		<div class="flex items-center gap-2">
			<span class="rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-stone-500">
				{completed ? 'Done' : active ? 'Active' : 'Draft'}
			</span>
			<button
				type="button"
				onclick={onToggleCollapse}
				class="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-100"
			>
				{collapsed ? 'Expand' : 'Collapse'}
			</button>
		</div>
	</div>

	<p class="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
		{guidance}
	</p>

	{#if !collapsed}
		<textarea
			value={value}
			placeholder={placeholder}
			oninput={(event) => onValueChange((event.currentTarget as HTMLTextAreaElement).value)}
			onfocus={onFocus}
			class="mt-4 min-h-[180px] w-full rounded-[1.5rem] border border-stone-300 bg-white px-4 py-4 text-[15px] leading-7 text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-500 focus:ring-4 focus:ring-stone-200"
		></textarea>
	{:else}
		<button
			type="button"
			onclick={onToggleCollapse}
			class="mt-4 w-full rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-left text-sm text-stone-500 transition hover:bg-stone-100"
		>
			Tap to expand this beat.
		</button>
	{/if}

	{#if warning}
		<p class="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
			{warning}
		</p>
	{/if}
</article>

<style>
	article.active {
		border-color: rgb(168 162 158 / 0.8);
		box-shadow: 0 0 0 1px rgba(168, 162, 158, 0.25), 0 20px 45px rgba(88, 64, 28, 0.11);
	}

	article.completed {
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(250, 250, 249, 0.96));
	}
</style>