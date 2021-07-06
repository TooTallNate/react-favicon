import Head from 'next/head';
import { useState } from 'react';
import Favicon from '../src';

export default () => {
	const [favicon, setFavicon] = useState('');
	const content = (
		<>
			hi
			<div style={{ backgroundColor: 'pink' }}>asdf</div>
		</>
	);
	return (
		<>
			<Favicon setFavicon={setFavicon}>{content}</Favicon>
			<Head>{favicon && <link rel="icon" href={favicon} />}</Head>
			<div>{content}</div>
		</>
	);
};
