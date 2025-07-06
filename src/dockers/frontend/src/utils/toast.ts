export class ToastService {
	static show(message: string, type: 'success' | 'error' = 'success') {
		let container = document.getElementById('toast-container');
		if (!container) {
			container = document.createElement('div');
			container.id = 'toast-container';
			container.className = 'fixed top-4 right-4 z-50 space-y-2';
			document.body.appendChild(container);
		}

		const toast = document.createElement('div');
		toast.className = `
			max-w-xs w-full px-4 py-3 rounded shadow text-white text-sm font-medium flex justify-between items-center
			${type === 'success' ? 'bg-green-600' : 'bg-red-600'}
			animate-slide-in
		`;
		toast.innerHTML = `
			<span class="flex-1">${message}</span>
			<button class="ml-4 font-bold" onclick="this.parentElement?.remove()">×</button>
		`;

		container.appendChild(toast);

		setTimeout(() => {
			toast.classList.remove('animate-slide-in');
			toast.classList.add('animate-fade-out');
			toast.addEventListener('animationend', () => toast.remove());
		}, 3000);
	}
}
