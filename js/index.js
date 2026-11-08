~ function(){
	var GITHUB_OWNER  = 'xbuilf';
	var GITHUB_REPO   = 'tupian';
	var GITHUB_BRANCH = 'main';
	var GITHUB_TOKEN  = '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';
	var PHOTO_DIR    = '';

	var camera, scene, renderer, controls;
	var objects = [];
	var targets = { table: [], sphere: [], helix: [], grid: [] };

	function init() {
		scene = new THREE.Scene();
		camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
		camera.position.z = 3000;

		renderer = new THREE.CSS3DRenderer();
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.domElement.style.position = 'absolute';
		document.getElementById('container').appendChild(renderer.domElement);

		// 代理请求文件树
		fetch(`https://api.jsdelivr.com/v1/github/${GITHUB_OWNER}?repo=${GITHUB_REPO}&branch=${GITHUB_BRANCH}&path=${PHOTO_DIR}&recursive=1&access_token=${GITHUB_TOKEN}`)
		.then(res=>res.json())
		.then(json=>{
			let imgUrls = [];
			if(json.tree){
				json.tree.forEach(item=>{
					const isFile = item.type === "blob";
					const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(item.path);
					if(isFile && isImg){
						const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@${GITHUB_BRANCH}/${item.path}`;
						imgUrls.push(cdnUrl);
					}
				})
			}
			createObjects(imgUrls);
			transform(targets.sphere, 2000);
			animate();
		})
		.catch(err=>{
			alert("图片加载失败："+err);
			console.error(err);
		})

		// 切换布局按钮
		document.getElementById('table').addEventListener('click', ()=>transform(targets.table, 2000));
		document.getElementById('sphere').addEventListener('click', ()=>transform(targets.sphere, 2000));
		document.getElementById('helix').addEventListener('click', ()=>transform(targets.helix, 2000));
		document.getElementById('grid').addEventListener('click', ()=>transform(targets.grid, 2000));

		controls = new THREE.TrackballControls(camera, renderer.domElement);
		controls.rotateSpeed = 0.5;
		controls.zoomSpeed = 0.8;
		controls.panSpeed = 0.3;
		controls.noZoom = false;
		controls.noPan = false;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;

		window.addEventListener('resize', onWindowResize);
	}

	function createObjects(imgList) {
		for(let i=0;i<imgList.length;i++){
			const element = document.createElement('div');
			element.className = 'element';
			element.style.backgroundImage = `url(${imgList[i]})`;
			element.style.backgroundSize = 'cover';
			element.style.backgroundPosition = 'center';
			element.dataset.src = imgList[i];
			element.style.cursor = 'pointer';
			element.onclick = function(e){
				e.stopPropagation();
				showBigImg(this.dataset.src);
			}

			const object = new THREE.CSS3DObject(element);
			object.position.x = Math.random() * 4000 - 2000;
			object.position.y = Math.random() * 4000 - 2000;
			object.position.z = Math.random() * 4000 - 2000;
			scene.add(object);
			objects.push(object);

			// 表格布局
			const table = targets.table;
			const tx = (i % 5) * 250 - 500;
			const ty = -Math.floor(i / 5) * 250 + 500;
			table.push(new THREE.Vector3(tx, ty, 0));

			// 球体布局
			const sphere = targets.sphere;
			const phi = Math.acos(-1 + (2 * i) / imgList.length);
			const theta = Math.sqrt(imgList.length * Math.PI) * phi;
			sphere.push(new THREE.Vector3(800 * Math.cos(theta) * Math.sin(phi), 800 * Math.sin(theta) * Math.sin(phi), 800 * Math.cos(phi)));

			// 螺旋布局
			const helix = targets.helix;
			const hphi = i * 0.175 + Math.PI;
			const htheta = i * 0.04;
			helix.push(new THREE.Vector3(900 * Math.sin(htheta) * Math.cos(hphi), 900 * Math.sin(hphi), 900 * Math.cos(htheta) * Math.cos(hphi)));

			// 网格布局
			const grid = targets.grid;
			const gx = ((i % 4) - 1.5) * 250;
			const gy = (Math.floor(i / 4) % 4 - 1.5) * 250;
			const gz = (Math.floor(i / 16) - 1.5) * 250;
			grid.push(new THREE.Vector3(gx, gy, gz));
		}
	}

	// 原生大图弹窗
	function showBigImg(url) {
		let overlay = document.createElement("div");
		overlay.style.position = "fixed";
		overlay.style.left = 0;
		overlay.style.top = 0;
		overlay.style.width = "100vw";
		overlay.style.height = "100vh";
		overlay.style.background = "rgba(0,0,0,0.85)";
		overlay.style.zIndex = "99999";
		overlay.style.display = "flex";
		overlay.style.alignItems = "center";
		overlay.style.justifyContent = "center";
		let img = document.createElement("img");
		img.src = url;
		img.style.maxWidth = "95vw";
		img.style.maxHeight = "95vh";
		overlay.appendChild(img);
		overlay.onclick = ()=>overlay.remove();
		document.body.appendChild(overlay);
	}

	function transform(target, duration) {
		TWEEN.removeAll();
		for(let i=0;i<objects.length;i++){
			const object = objects[i];
			const targetPos = target[i];
			new TWEEN.Tween(object.position)
			.to({x:targetPos.x, y:targetPos.y, z:targetPos.z}, duration)
			.easing(TWEEN.Easing.Exponential.InOut)
			.start();
		}
		new TWEEN.Tween(this)
		.to({}, duration)
		.onUpdate(()=>render())
		.start();
	}

	function animate() {
		requestAnimationFrame(animate);
		TWEEN.update();
		controls.update();
		render();
	}

	function render() {
		renderer.render(scene, camera);
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
	}

	init();
}();
