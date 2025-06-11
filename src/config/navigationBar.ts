// Navigation Bar
// ------------
// Description: The navigation bar data for the website.
export interface Logo {
	src: string
	alt: string
	text: string
}

export interface NavSubItem {
	name: string
	link: string
}

export interface NavItem {
	name: string
	link: string
	submenu?: NavSubItem[]
}

export interface NavAction {
	name: string
	link: string
	style: string
	size: string
}

export interface NavData {
	logo: Logo
	navItems: NavItem[]
	navActions: NavAction[]
}

export const navigationBarData: NavData = {
	logo: {
		src: '/logo.png',
		alt: 'Ossept',
		text: 'OSSEPT'
	},
	navItems: [
		{ name: 'Inicio', link: '/' },
		{ name: 'Noticias', link: '/pricing' },
		{ name: 'Directivos', link: '/features' },
		{
			name: 'Nuestra Organización',
			link: '#',
			submenu: [
				{ name: 'Misión', link: '/blog' },
				{ name: 'Visión', link: '/changelog' },
				{ name: 'Estatutos', link: '/faq' },
				{ name: 'Acuerdos', link: '/terms' }
			]
		},
		{ name: 'Contáctenos', link: '/contact' }
	],
	navActions: [{ name: '', link: '/', style: 'dark' , size: 'lg' }]
}
