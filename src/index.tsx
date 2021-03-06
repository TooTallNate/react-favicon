import createDebug from 'debug';
import { useEffect, useRef, useState } from 'react';

const debug = createDebug('react-favicon');

function removeSourceMappingURL(input: string): string {
	return input
		.trim()
		.split('\n')
		.filter(
			(l) =>
				!l.startsWith('/*# sourceMappingURL=') &&
				!l.startsWith('/*@ sourceURL=')
		)
		.join('\n');
}

function getClassNames(el: Element, classNames: string[] = []): string[] {
	const className = typeof el.className === 'string' && el.className.trim();
	if (className) {
		classNames.push(...className.split(/\s+/));
	}

	for (const child of el.children) {
		getClassNames(child, classNames);
	}

	return classNames;
}

export default function Favicon({
	width = 32,
	height = 32,
	children,
	setFavicon,
}: any) {
	const div = useRef<HTMLDivElement | null>(null);
	const [styles, setStyles] = useState('');
	const [stylesheets, setStylesheets] = useState('');

	useEffect(() => {
		if (!div.current) return;
		debug('Component mounted');

		const observers = new Map<Element, MutationObserver>();

		const head = document.querySelector('head');
		if (head) {
			const headObserver = new MutationObserver(function () {
				debug('<head> mutation detected', [...arguments]);
				updateStyles();
			});
			observers.set(head, headObserver);
			headObserver.observe(head, {
				subtree: true,
				childList: true,
				attributes: true,
				characterData: true,
			});
		}

		function updateStyles() {
			if (!div.current) return;
			const classNames = getClassNames(div.current);
			const styles = [...document.querySelectorAll('head style')].filter(
				(el) => {
					const css = el.innerHTML;
					return classNames.some((c) => css.includes(`.${c}`));
				}
			);
			styles.forEach((style) => {
				if (observers.has(style)) return;
				const observer = new MutationObserver(() => {
					debug('<style> mutation detected');
					updateStyles();
				});
				observers.set(style, observer);
				observer.observe(style, {
					subtree: true,
					childList: true,
					attributes: true,
					characterData: true,
				});
			});
			const css = styles
				.map((el) => removeSourceMappingURL(el.innerHTML))
				.join('\n');
			setStyles(css);
		}
		updateStyles();

		const stylesheets: string[] = [];
		for (const link of document.querySelectorAll(
			'head link[rel="stylesheet"]'
		)) {
			const href = link.getAttribute('href');
			if (href) {
				stylesheets.push(href);
			}
		}
		Promise.all(
			stylesheets.map((href) => fetch(href).then((r) => r.text()))
		).then((data) => {
			setStylesheets(data.join('\n'));
		});

		const observer = new MutationObserver(update);
		observers.set(div.current, observer);
		observer.observe(div.current, {
			subtree: true,
			childList: true,
			attributes: true,
			characterData: true,
		});

		let previousHtml = '';

		function update() {
			const html = div.current?.innerHTML;
			if (!html || html === previousHtml) return;
			debug('HTML changed');

			const favicon = `data:image/svg+xml,${encodeURIComponent(html)}`;
			previousHtml = html;
			setFavicon(favicon);
		}

		update();

		return () => {
			debug('Disconnect');
			for (const observer of observers.values()) {
				observer.disconnect();
			}
		};
	}, []);

	return (
		<div ref={div} style={{ display: 'none', position: 'absolute' }}>
			<svg
				fill="none"
				viewBox={`0 0 ${width} ${height}`}
				xmlns="http://www.w3.org/2000/svg"
			>
				<foreignObject width="100%" height="100%">
					<style>{`@media (prefers-color-scheme: dark) {
                        * {
                        color: white;
                        }
}`}</style>
					<style>{styles}</style>
					<style>{stylesheets}</style>
					<div
						// @ts-ignore
						xmlns="http://www.w3.org/1999/xhtml"
						style={{ width: '100%', height: '100%' }}
					>
						{children}
					</div>
				</foreignObject>
			</svg>
		</div>
	);
}
