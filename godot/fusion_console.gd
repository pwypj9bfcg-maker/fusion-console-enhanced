# fusion_console.gd — pairs with the .tscn exported from Fusion Console.
# Exposes `wallpaper` and `accent`, keeps the Clock live, and hooks up tile presses.
extends Control

@export var wallpaper: String = "violet"
@export var accent: Color = Color(0.545, 0.361, 0.965)

@onready var background: ColorRect = $Background
@onready var clock_label: Label = $Clock

const WALLPAPERS_DEFAULT := Color(0.039, 0.047, 0.078)
const WALLPAPER_COLORS := {
	"violet": Color(0.039, 0.047, 0.078),
	"aurora": Color(0.02, 0.031, 0.063),
	"ember": Color(0.063, 0.039, 0.071),
	"graphite": Color(0.043, 0.051, 0.071),
}

func _ready() -> void:
	_apply_theme()

func _process(_delta: float) -> void:
	clock_label.text = Time.get_time_string_from_system()

func _apply_theme() -> void:
	background.color = WALLPAPER_COLORS.get(wallpaper, WALLPAPERS_DEFAULT)
	for tile in $Library.get_children():
		if tile is Button:
			tile.add_theme_color_override("font_color", accent)
			tile.add_theme_color_override("font_hover_color", Color.WHITE)
			tile.pressed.connect(_on_tile_pressed.bind(tile))

func _on_tile_pressed(tile: Button) -> void:
	print("Launching %s ..." % tile.text)
	# TODO: launch the game/application here, e.g. OS.create_process(...)
