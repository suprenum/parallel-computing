import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Guify from 'guify'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import terrainVertexShader from './shaders/terrain/vertex.glsl'
import terrainFragmentShader from './shaders/terrain/fragment.glsl'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Debug
 */
const gui = new Guify({
	align: 'right',
	theme: 'dark',
	width: '400px',
	barMode: 'none',
})
const guiDummy = {}
guiDummy.clearColor = '#000324'

/**
 * Sizes
 */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
	pixelRatio: Math.min(window.devicePixelRatio, 2),
}

window.addEventListener('resize', () => {
	// Update sizes
	sizes.width = window.innerWidth
	sizes.height = window.innerHeight
	sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

	// Update camera
	camera.aspect = sizes.width / sizes.height
	camera.updateProjectionMatrix()

	// Update renderer
	renderer.setSize(sizes.width, sizes.height)
	renderer.setPixelRatio(sizes.pixelRatio)

	// Update effect composer
	effectComposer.setSize(sizes.width, sizes.height)
	effectComposer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	100
)
camera.position.x = 0
camera.position.y = 2.124
camera.position.z = -0.172
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enabled = true
controls.enableDamping = true

/**
 * Terrain
 */
gui.Register({
	type: 'folder',
	label: 'terrain',
	open: false,
})

const terrain = {}

// Texture
terrain.texture = {}
terrain.texture.visible = false
terrain.texture.linesCount = 5
terrain.texture.bigLineWidth = 0.08
terrain.texture.smallLineWidth = 0.01
terrain.texture.smallLineAlpha = 0.5
terrain.texture.width = 1
terrain.texture.height = 128
terrain.texture.canvas = document.createElement('canvas')
terrain.texture.canvas.width = terrain.texture.width
terrain.texture.canvas.height = terrain.texture.height
terrain.texture.canvas.style.position = 'fixed'
terrain.texture.canvas.style.top = 0
terrain.texture.canvas.style.left = 0
terrain.texture.canvas.style.width = '50px'
terrain.texture.canvas.style.height = `${terrain.texture.height}px`
terrain.texture.canvas.style.zIndex = 1

if (terrain.texture.visible) {
	document.body.append(terrain.texture.canvas)
}

terrain.texture.context = terrain.texture.canvas.getContext('2d')

terrain.texture.instance = new THREE.CanvasTexture(terrain.texture.canvas)
terrain.texture.instance.wrapS = THREE.RepeatWrapping
terrain.texture.instance.wrapT = THREE.RepeatWrapping
terrain.texture.instance.magFilter = THREE.NearestFilter

terrain.texture.update = () => {
	terrain.texture.context.clearRect(
		0,
		0,
		terrain.texture.width,
		terrain.texture.height
	)

	// Big line
	const actualBigLineWidth = Math.round(
		terrain.texture.height * terrain.texture.bigLineWidth
	)
	terrain.texture.context.globalAlpha = 1
	terrain.texture.context.fillStyle = '#ffffff'

	terrain.texture.context.fillRect(
		0,
		0,
		terrain.texture.width,
		actualBigLineWidth
	)

	// Small lines
	const actualSmallLineWidth = Math.round(
		terrain.texture.height * terrain.texture.smallLineWidth
	)
	const smallLinesCount = terrain.texture.linesCount - 1

	for (let i = 0; i < smallLinesCount; i++) {
		terrain.texture.context.globalAlpha = terrain.texture.smallLineAlpha
		terrain.texture.context.fillStyle = '#00ffff'
		terrain.texture.context.fillRect(
			0,
			actualBigLineWidth +
				Math.round(
					(terrain.texture.height - actualBigLineWidth) /
						terrain.texture.linesCount
				) *
					(i + 1),
			terrain.texture.width,
			actualSmallLineWidth
		)
	}

	// Update texture instance
	terrain.texture.instance.needsUpdate = true
}

terrain.texture.update()

gui.Register({
	folder: 'terrain',
	type: 'folder',
	label: 'terrainTexture',
	open: true,
})

gui.Register({
	folder: 'terrainTexture',
	object: terrain.texture,
	property: 'visible',
	type: 'checkbox',
	label: 'visible',
	onChange: () => {
		if (terrain.texture.visible) {
			document.body.append(terrain.texture.canvas)
		} else {
			document.body.removeChild(terrain.texture.canvas)
		}
	},
})

gui.Register({
	folder: 'terrainTexture',
	object: terrain.texture,
	property: 'linesCount',
	type: 'range',
	label: 'linesCount',
	min: 1,
	max: 10,
	step: 1,
	onChange: terrain.texture.update,
})

gui.Register({
	folder: 'terrainTexture',
	object: terrain.texture,
	property: 'bigLineWidth',
	type: 'range',
	label: 'bigLineWidth',
	min: 0,
	max: 0.5,
	step: 0.0001,
	onChange: terrain.texture.update,
})

gui.Register({
	folder: 'terrainTexture',
	object: terrain.texture,
	property: 'smallLineWidth',
	type: 'range',
	label: 'smallLineWidth',
	min: 0,
	max: 0.1,
	step: 0.0001,
	onChange: terrain.texture.update,
})

gui.Register({
	folder: 'terrainTexture',
	object: terrain.texture,
	property: 'smallLineAlpha',
	type: 'range',
	label: 'smallLineAlpha',
	min: 0,
	max: 1,
	step: 0.001,
	onChange: terrain.texture.update,
})

// Geometry
terrain.geometry = new THREE.PlaneGeometry(1, 1, 1000, 1000)
terrain.geometry.rotateX(-Math.PI * 0.5)

// Uniforms
terrain.uniforms = {
	uTexture: { value: terrain.texture.instance },
	uElevation: { value: 2 },
	uElevationValley: { value: 0.4 },
	uElevationValleyFrequency: { value: 1.5 },
	uElevationGeneral: { value: 0.2 },
	uElevationGeneralFrequency: { value: 0.2 },
	uElevationDetails: { value: 0.248 },
	uElevationDetailsFrequency: { value: 0.729 },
	uTextureFrequency: { value: 10 },
	uTextureOffset: { value: 0.585 },
	uTime: { value: 0 },
	uHslHue: { value: 0.12 },
	uHslHueOffset: { value: 0.5 },
	uHslHueFrequency: { value: 10.0 },
	uHslTimeFrequency: { value: 0.05 },
	uHslLightness: { value: 0.75 },
	uHslLightnessVariation: { value: 0.25 },
	uHslLightnessFrequency: { value: 20.0 },
}

gui.Register({
	folder: 'terrain',
	type: 'folder',
	label: 'terrainMaterial',
	open: true,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uElevation,
	property: 'value',
	type: 'range',
	label: 'uElevation',
	min: 0,
	max: 5,
	step: 0.001,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uElevationValley,
	property: 'value',
	type: 'range',
	label: 'uElevationValley',
	min: 0,
	max: 1,
	step: 0.001,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uElevationValleyFrequency,
	property: 'value',
	type: 'range',
	label: 'uElevationValleyFrequency',
	min: 0,
	max: 10,
	step: 0.001,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uElevationGeneral,
	property: 'value',
	type: 'range',
	label: 'uElevationGeneral',
	min: 0,
	max: 1,
	step: 0.001,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uElevationGeneralFrequency,
	property: 'value',
	type: 'range',
	label: 'uElevationGeneralFrequency',
	min: 0,
	max: 10,
	step: 0.001,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uElevationDetails,
	property: 'value',
	type: 'range',
	label: 'uElevationDetails',
	min: 0,
	max: 1,
	step: 0.001,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uElevationDetailsFrequency,
	property: 'value',
	type: 'range',
	label: 'uElevationDetailsFrequency',
	min: 0,
	max: 10,
	step: 0.001,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uTextureFrequency,
	property: 'value',
	type: 'range',
	label: 'uTextureFrequency',
	min: 0.01,
	max: 50,
	step: 0.01,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uTextureOffset,
	property: 'value',
	type: 'range',
	label: 'uTextureOffset',
	min: 0,
	max: 1,
	step: 0.001,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uHslHue,
	property: 'value',
	type: 'range',
	label: 'uHslHue',
	min: 0,
	max: 1,
	step: 0.001,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uHslHueOffset,
	property: 'value',
	type: 'range',
	label: 'uHslHueOffset',
	min: 0,
	max: 1,
	step: 0.001,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uHslHueFrequency,
	property: 'value',
	type: 'range',
	label: 'uHslHueFrequency',
	min: 0,
	max: 50,
	step: 0.01,
})
gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uHslTimeFrequency,
	property: 'value',
	type: 'range',
	label: 'uHslTimeFrequency',
	min: 0,
	max: 0.2,
	step: 0.001,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uHslLightness,
	property: 'value',
	type: 'range',
	label: 'uHslLightness',
	min: 0,
	max: 1,
	step: 0.001,
})

gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uHslLightnessVariation,
	property: 'value',
	type: 'range',
	label: 'uHslLightnessVariation',
	min: 0,
	max: 1,
	step: 0.001,
})
gui.Register({
	folder: 'terrainMaterial',
	object: terrain.uniforms.uHslLightnessFrequency,
	property: 'value',
	type: 'range',
	label: 'uHslLightnessFrequency',
	min: 0,
	max: 50,
	step: 0.01,
})

// Material
terrain.material = new THREE.ShaderMaterial({
	transparent: true,
	side: THREE.DoubleSide,
	vertexShader: terrainVertexShader,
	fragmentShader: terrainFragmentShader,
	uniforms: terrain.uniforms,
})

// Depth material
const uniforms = THREE.UniformsUtils.merge([
	THREE.UniformsLib.common,
	THREE.UniformsLib.displacementmap,
])
for (const uniformKey in terrain.uniforms) {
	uniforms[uniformKey] = terrain.uniforms[uniformKey]
}

// Mesh
terrain.mesh = new THREE.Mesh(terrain.geometry, terrain.material)
terrain.mesh.scale.set(10, 10, 10)
scene.add(terrain.mesh)

/**
 * Renderer
 */
// Renderer
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
})
renderer.setClearColor(guiDummy.clearColor, 1)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

gui.Register({
	type: 'folder',
	label: 'renderer',
	open: true,
})

gui.Register({
	folder: 'renderer',
	object: guiDummy,
	property: 'clearColor',
	type: 'color',
	label: 'clearColor',
	format: 'hex',
	onChange: () => {
		renderer.setClearColor(guiDummy.clearColor, 1)
	},
})

// Effect composer
const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(sizes.pixelRatio)

// Render pass
const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

/**
 * View
 */
const view = {}
view.index = 0
view.settings = [
	{
		position: { x: 0, y: 2.124, z: -0.172 },
		rotation: { x: -1.489, y: -Math.PI, z: 0 },
		focus: 2.14,
		parallaxMultiplier: 0.25,
	},
	{
		position: { x: 1, y: 1.1, z: 0 },
		rotation: { x: -0.833, y: 1.596, z: 1.651 },
		focus: 1.1,
		parallaxMultiplier: 0.12,
	},
	{
		position: { x: 1, y: 0.87, z: -0.97 },
		rotation: { x: -0.638, y: 2.33, z: 0 },
		focus: 1.36,
		parallaxMultiplier: 0.12,
	},
	{
		position: { x: -1.43, y: 0.33, z: -0.144 },
		rotation: { x: -0.312, y: -1.67, z: 0 },
		focus: 1.25,
		parallaxMultiplier: 0.12,
	},
]

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
	const elapsedTime = clock.getElapsedTime()

	// Update terrain
	terrain.uniforms.uTime.value = elapsedTime

	// Update controls
	controls.update()

	// Render
	effectComposer.render()

	// Call tick again on the next frame
	window.requestAnimationFrame(tick)
}

tick()
