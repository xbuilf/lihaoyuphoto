~ function(){
	var GITEE_OWNER  = 'lihaoyu061';
	var GITEE_REPO   = 'photo';
	var GITEE_BRANCH = 'master';
	var GITEE_TOKEN  = '04b10718b6c7738bc244c0f6d9b0b91e';
	var PHOTO_DIR    = '';

	var camera, scene, renderer;
	var controls;
	var objects = [];
	var targets = { table: [], sphere: [], helix: [], grid: [] };

	//【原生弹窗函数，写在全局】
	function showBigImage(url){
		let overlay = document.createElement("div");
		overlay.style.position="fixed";
		overlay.style.left=0;overlay.style.top=0;
		overlay.style.width="100vw";overlay.style.height="100vh";
		overlay.style.background="rgba(0,0,0,0.85)";
		overlay.style.zIndex="99999";
		overlay.style.display="flex";
		overlay.style.alignItems="center";
		overlay.style.justifyContent="center";

		let img = document.createElement("img");
		img.src=url;
		img.style.maxWidth="95vw";
		img.style.maxHeight="95vh";

		overlay.appendChild(img);
		//点击黑色遮罩关闭大图
		overlay.onclick=()=> overlay.remove();
		document.body.appendChild(overlay);
	}

	init();
	animate();

	async function init() {
		let imgUrls = [];
		try{
			const treeUrl = `https://gitee.com/api/v5/repos/${GITEE_OWNER}/${GITEE_REPO}/git/trees/${GITEE_BRANCH}?recursive=1&access_token=${GITEE_TOKEN}`;
			const res = await fetch(treeUrl);
			const json = await res.json();
			if(!json.tree) throw new Error("获取文件树失败");

			json.tree.forEach(item=>{
				let okDir = PHOTO_DIR==="" ? true : item.path.startsWith(PHOTO_DIR+"/");
				const isFile = item.type === "blob";
				const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(item.path);
				if(okDir && isFile && isImg){
					const rawUrl = `https://gitee.com/${GITEE_OWNER}/${GITEE_REPO}/raw/${GITEE_BRANCH}/${item.path}`;
					imgUrls.push(rawUrl);
				}
			});

			if(imgUrls.length===0){
				alert("没有读取到图片，请检查仓库、token、图片后缀");
				return;
			}
		}catch(err){
			alert("接口异常："+err);
			return;
		}

		camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
		camera.position.z = 3000;
		scene = new THREE.Scene();

		for ( var i = 0; i < imgUrls.length; i ++ ) {
			var element = document.createElement( 'div' );
			element.className = 'element';
			element.style.backgroundColor = 'rgba(0,127,127,' + ( Math.random() * 0.5 + 0.25 ) + ')';
			element.style.backgroundImage = `url(${imgUrls[i]})`;
			element.style.backgroundSize = 'cover';
			element.title = `图库 ${i+1}/${imgUrls.length}`;
			element.dataset.src = imgUrls[i];
			element.style.cursor="pointer";

			//绑定点击，e.stopPropagation 阻止threejs鼠标事件吃掉点击
			element.onclick = function(e){
				e.stopPropagation();
				showBigImage(this.dataset.src);
			};

			var object = new THREE.CSS3DObject( element );
			object.position.x = Math.random() * 4000 - 2000;
			object.position.y = Math.random() * 4000 - 2000;
			object.position.z = Math.random() * 4000 - 2000;
			scene.add( object );
			objects.push( object );

			var objTable = new THREE.Object3D();
			objTable.position.x = ( (i % 5) * 140 ) - 1330;
			objTable.position.y = - ( Math.floor(i /5) * 180 ) + 990;
			targets.table.push( objTable );
		}

		var vector = new THREE.Vector3();
		for ( var i = 0, l = objects.length; i < l; i ++ ) {
			var phi = Math.acos( -1 + ( 2 * i ) / l );
			var theta = Math.sqrt( l * Math.PI ) * phi;
			var object = new THREE.Object3D();
			object.position.x = 800 * Math.cos( theta ) * Math.sin( phi );
			object.position.y = 800 * Math.sin( theta ) * Math.sin( phi );
			object.position.z = 800 * Math.cos( phi );
			vector.copy( object.position ).multiplyScalar( 2 );
			object.lookAt( vector );
			targets.sphere.push( object );
		}

		var vector = new THREE.Vector3();
		for ( var i = 0, l = objects.length; i < l; i ++ ) {
			var phi = i * 0.175 + Math.PI;
			var object = new THREE.Object3D();
			object.position.x = 900 * Math.sin( phi );
			object.position.y = - ( i * 8 ) + 450;
			object.position.z = 900 * Math.cos( phi );
			vector.x = object.position.x * 2;
			vector.y = object.position.y;
			vector.z = object.position.z * 2;
			object.lookAt( vector );
			targets.helix.push( object );
		}

		for ( var i = 0; i < objects.length; i ++ ) {
			var object = new THREE.Object3D();
			object.position.x = ( ( i % 5 ) * 400 ) - 800;
			object.position.y = ( - ( Math.floor( i / 5 ) % 5 ) * 400 ) + 800;
			object.position.z = ( Math.floor( i / 25 ) ) * 1000 - 2000;
			targets.grid.push( object );
		}

		renderer = new THREE.CSS3DRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.domElement.style.position = 'absolute';
		document.getElementById( 'container' ).appendChild( renderer.domElement );

		controls = new THREE.TrackballControls( camera, renderer.domElement );
		controls.rotateSpeed = 0.5;
		controls.minDistance = 500;
		controls.maxDistance = 6000;
		controls.addEventListener( 'change', render );

		document.getElementById( 'table' ).addEventListener( 'click', function () {
			transform( targets.table, 2000 );
		}, false );
		document.getElementById( 'sphere' ).addEventListener( 'click', function () {
			transform( targets.sphere, 2000 );
		}, false );
		document.getElementById( 'helix' ).addEventListener( 'click', function () {
			transform( targets.helix, 2000 );
		}, false );
		document.getElementById( 'grid' ).addEventListener( 'click', function () {
			transform( targets.grid, 2000 );
		}, false );

		transform( targets.sphere, 3000 );

		var $buttons = $('#menu > button');
		$buttons.on('click.btns',function(e){
			$buttons.removeClass('hover');
			$(e.target).addClass('hover');
		});

		window.addEventListener( 'resize', onWindowResize, false );
	}

	function transform( targets, duration ) {
		TWEEN.removeAll();
		for ( var i = 0; i < objects.length; i ++ ) {
			var object = objects[ i ];
			var target = targets[ i ];
			new TWEEN.Tween( object.position )
				.to( { x: target.position.x, y: target.position.y, z: target.position.z }, Math.random() * duration + duration )
				.easing( TWEEN.Easing.Exponential.InOut )
				.start();
			new TWEEN.Tween( object.rotation )
				.to( { x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, Math.random() * duration + duration )
				.easing( TWEEN.Easing.Exponential.InOut )
				.start();
		}
		new TWEEN.Tween( this )
			.to( {}, duration * 2 )
			.onUpdate( render )
			.start();
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
		render();
	}

	function animate() {
		requestAnimationFrame( animate );
		TWEEN.update();
		controls.update();
	}

	function render() {
		renderer.render( scene, camera );
	}
}();
