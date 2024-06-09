import axios from 'axios';
import fs from 'fs';
import path from 'path';

const SAVE_LOCAL_HTML_FOLDER_NAME = 'saved_pages';

export const getHTML = async (url: string) => {
	const res = await axios.get(url);

	const html = res.data;

	return html;
};
