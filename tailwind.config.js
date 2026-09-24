/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
  	container: {
  		center: 'true',
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
		backgroundImage:{
			'bgImage': "url('../assets/bgImage2.png')",
			'industrial-cityscape': "url('../assets/industrial-cityscape.jpg')",
			'steam-texture': "url('../assets/steam-texture.png')",
		},
  		fontFamily: {
  			spicyRice: 'var(--font-spicyRice)',
			heading: ['var(--font-syne)', 'Syne', 'sans-serif'],
			syne: ['var(--font-syne)', 'Syne', 'sans-serif'],
			label: ['var(--font-space-grotesk)', 'Space Grotesk', 'sans-serif'],
			mono: ['var(--font-space-grotesk)', 'Space Grotesk', 'monospace'],
			serif: ['Lora', 'serif'],
			industrial: ['var(--font-syne)', 'Syne', 'sans-serif'],
			mechanical: ['var(--font-space-grotesk)', 'Space Grotesk', 'monospace']
  		},
		boxShadow: {
			'brutal-sm': '2px 2px 0px 0px #101010',
			'brutal': '4px 4px 0px 0px #101010',
			'brutal-lg': '6px 6px 0px 0px #101010',
			'brutal-xl': '8px 8px 0px 0px #101010',
		},
  		colors: {
			invente: {
				bg: '#FFF9F3',
				paper: '#FBF9F4',
				ink: '#101010',
				yellow: '#FFD12E',
				'yellow-light': '#FFDA58',
				orange: '#FF6B35',
				pink: '#FE90E9',
				'pink-light': '#FF8AD4',
				cyan: '#C1F8FF',
				lime: '#9AE885',
				'lime-light': '#B0EF9E',
				purple: '#D4A5FF',
				muted: '#8A857A',
			},
			// Retain legacy tokens for backwards compatibility
			industrial: {
				'charcoal': '#1F1F1F',
				'coal': '#101010',  
				'copper': '#FFD12E',
				'brass': '#FFC83B',
				'steam': '#FFF9F3',
				'iron': '#2C2C2C',
				'rust': '#FF6B35',
				'fire': '#FF5722',
				'smoke': '#8A857A',
				'steel': '#C1F8FF',
				'bronze': '#9AE885',
				'pewter': '#D4A5FF',
				'gunmetal': '#101010',
				'amber': '#FFD12E'
			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}