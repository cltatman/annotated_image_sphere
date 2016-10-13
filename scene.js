var viewport_width = window.innerWidth;
var viewport_height = window.innerHeight;

var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();

var camera = (function build_camera() {
  var fov = 50;
  var aspect_ratio = viewport_width / viewport_height;
  var near_clip = 0.1;
  var far_clip = 1000;

  var new_camera = new THREE.PerspectiveCamera(fov, aspect_ratio, near_clip, far_clip);
  new_camera.position.z = 0.1;

  return new_camera;
})();

var camera_controls = new THREE.OrbitControls(camera, renderer.domElement);

var dom_event_provider = new THREEx.DomEvents(camera, renderer.domElement);

var annotation_texture = null;
var sphere_mesh = null;
var focussed_annotation_mesh = null;

var annotation_content_container = document.getElementById('annotation-content');



var load_image_sphere = function (image, annotations) {
  var texture_loader = new THREE.TextureLoader();

  var image_texture = texture_loader.load(image);
  annotation_texture = texture_loader.load('annotation.png');

  var annotation_meshes = generate_annotation_meshes(annotations, annotation_texture);
  annotation_meshes.forEach(function (mesh) { scene.add(mesh); });

  start_scene_for_image(image_texture, annotation_texture);
};


var show_annotation_content = function (content, x, y) {
  annotation_content_container.textContent = content;
  var width = annotation_content_container.offsetWidth;
  var height = annotation_content_container.offsetHeight;
  var rendered_x = x - width * 0.5;
  var rendered_y = y + height * 0.9;
  annotation_content_container.style.transform = "translateX(" + rendered_x + "px) translateY(" + rendered_y + "px)";
};


var hide_annotation_content = function (annotation) {
  annotation_content_container.style.transform = "translateX(-10000%)";
};


var generate_annotation_mesh = function (annotation, annotation_texture) {
  var material = new THREE.SpriteMaterial({ map: annotation_texture, transparent: true, opacity: 0.5 });
  var new_annotation_mesh = new THREE.Sprite( material );

  new_annotation_mesh.position.x = annotation.x;
  new_annotation_mesh.position.y = annotation.y;
  new_annotation_mesh.position.z = annotation.z;
  new_annotation_mesh.scale.x = 1.4;
  new_annotation_mesh.scale.y = 1.4;
  new_annotation_mesh.data = { content: annotation.content };

  dom_event_provider.addEventListener(new_annotation_mesh, 'mouseover', function (event) {
    new_annotation_mesh.material.opacity = 0.8;
    focussed_annotation_mesh = new_annotation_mesh;
  });

  dom_event_provider.addEventListener(new_annotation_mesh, 'mouseout', function () {
    new_annotation_mesh.material.opacity = 0.5;
    focussed_annotation_mesh = undefined;
  });

  return new_annotation_mesh;
};


var generate_annotation_meshes = function (annotations, annotation_texture) {
  return annotations.map(function (annotation) {
    return generate_annotation_mesh(annotation, annotation_texture);
  });
};


var start_scene_for_image = function (texture) {
  { // setup camera controls
    camera_controls.enablePan = false;
    camera_controls.enableZoom = false;
    camera_controls.enableDamping = true;
    camera_controls.dampingFactor = 0.05;
    camera_controls.rotateSpeed = -0.02;

    camera_controls.minPolarAngle = Math.PI * 0.25;
    camera_controls.maxPolarAngle = Math.PI * 0.75;
  }

  { // setup the sphere mesh & add to scene
    var geometry = new THREE.SphereGeometry(100, 32, 32);
    var material = new THREE.MeshBasicMaterial({ map: texture });
    sphere_mesh = new THREE.Mesh(geometry, material);
    sphere_mesh.scale.x = -1;

    scene.add(sphere_mesh);
  }

  { // setup renderer & add to dom
    renderer.setSize(viewport_width, viewport_height);
    document.body.appendChild(renderer.domElement);
  }

  render_scene();
};


var render_scene = function render_scene() {
  requestAnimationFrame(render_scene);
  renderer.render(scene, camera);
  camera_controls.update();

  if (focussed_annotation_mesh) {
    var screen_position = focussed_annotation_mesh.position.clone().project(camera);

    screen_position.x = (screen_position.x + 1) / 2 * viewport_width;
    screen_position.y = -(screen_position.y - 1) / 2 * viewport_height;

    focussed_annotation_mesh.material.opacity = 0.8;
    show_annotation_content(focussed_annotation_mesh.data.content, screen_position.x, screen_position.y);
  } else {
    hide_annotation_content();
  }
};


var screen_position_to_scene_position = function (position, camera, distance) {
  var screen_vector = new THREE.Vector3();

  screen_vector.set((position.x / viewport_width) * 2 - 1, -(position.y / viewport_height) * 2 + 1, 0.5);
  screen_vector.unproject(camera);

  var direction = screen_vector.sub(camera.position).normalize();
  return camera.position.clone().add(direction.multiplyScalar(distance));
};


var annotations = [
  { content: 'sliding doors', x: 10, y: 0, z: -5 },
  { content: 'nice table', x: -10, y: -5, z: -8 },
  { content: 'cool tree picture', x: -10, y: 0, z: -12 },
  { content: 'nice door', x: -1.8, y: 0, z: -12 },
  { content: 'fancy walkway', x: 20, y: 0, z: 7 },
  { content: 'hammock things', x: -13, y: -2, z: 1 },
  { content: 'cool pool', x: -22, y: -5, z: -3 },
  { content: 'thirsty plants', x: -3, y: -1, z: 6 },
  { content: 'patio lights', x: -6, y: 5, z: -3 }
];

var create_annotation_on_click = false;


document.addEventListener('keydown', function (e) {
  create_annotation_on_click = true;
});

document.addEventListener('keyup', function (e) {
  create_annotation_on_click = false;
});

document.addEventListener('click', function (event) {
  if (!create_annotation_on_click) {
    return;
  }

  var mouse_position = { x: event.clientX, y: event.clientY };
  var distance_from_camera = 13;

  var new_annotation_position = screen_position_to_scene_position(mouse_position, camera, distance_from_camera);
  var random_content = ['a thing', 'a different thing', 'something old', 'something new', 'lorem ipsum', 'new annotation', 'click click'];

  var annotation_mesh = generate_annotation_mesh({
    content: random_content[Math.floor(Math.random() * random_content.length)],
    x: new_annotation_position.x,
    y: new_annotation_position.y,
    z: new_annotation_position.z
  }, annotation_texture);

  scene.add(annotation_mesh);
});


load_image_sphere('patio.jpg', annotations);
