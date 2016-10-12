var viewport_width = window.innerWidth;
var viewport_height = window.innerHeight;

var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();

var camera = (function build_camera() {
  var fov = 50;
  var aspect_ratio = viewport_width / viewport_height;
  var near_clip = 0.1;
  var far_clip = 1000;

  return new THREE.PerspectiveCamera(fov, aspect_ratio, near_clip, far_clip);
})();

var sphere_mesh = undefined;

var load_image_sphere = function (image) {
  new THREE.TextureLoader().load(image, start_scene_for_image);
};

var start_scene_for_image = function (texture) {
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

  sphere_mesh.rotation.y += 0.001;
};


load_image_sphere('patio.jpg');
