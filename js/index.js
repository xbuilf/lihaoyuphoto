~ function(){
    const OWNER = "xbuilf";
    const REPO  = "lihaoyuphoto";
    const BRANCH = "main";
    // 上一级，仓库根目录下的 photo
    const ROOT_DIR = "photo";

    var camera, scene, renderer, controls;
    var objects = [];
    var targets = { table: [], sphere: [], helix: [], grid: [] };

    // 递归遍历目录
    async function walk(path){
        let list = [];
        const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
        const res = await fetch(url);
        if(!res.ok){
            console.error("请求失败", await res.text());
            return list;
        }
        const arr = await res.json();
        if(!Array.isArray(arr)) return list;
        for(let item of arr){
            if(item.type === "file"){
                const isImg = /\.(jpg|jpeg|png|webp|gif)$/i.test(item.name);
                if(isImg){
                    const cdnUrl = `https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@${BRANCH}/${item.path}`;
                    list.push(cdnUrl);
                }
            }else if(item.type === "dir"){
                const subList = await walk(item.path);
                list = list.concat(subList);
            }
        }
        return list;
    }

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

    async function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.z = 3000;

        renderer = new THREE.CSS3DRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = 'absolute';
        document.getElementById('container').appendChild(renderer.domElement);

        const imgUrls = await walk(ROOT_DIR);
        console.log("加载图片列表：", imgUrls);
        if(imgUrls.length === 0){
            alert("没有读取到图片，大概率触发GitHub限流403");
        }
        createObjects(imgUrls);
        transform(targets.sphere, 3000);

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
        animate();
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

            const objTable = new THREE.Object3D();
            objTable.position.x = ( (i % 5) * 140 ) - 1330;
            objTable.position.y = - ( Math.floor(i /5) * 180 ) + 990;
            targets.table.push(objTable);

            const vectorS = new THREE.Vector3();
            const phi = Math.acos( -1 + ( 2 * i ) / imgList.length );
            const theta = Math.sqrt( imgList.length * Math.PI ) * phi;
            const objSphere = new THREE.Object3D();
            objSphere.position.x = 800 * Math.cos( theta ) * Math.sin( phi );
            objSphere.position.y = 800 * Math.sin( theta ) * Math.sin( phi );
            objSphere.position.z = 800 * Math.cos( phi );
            vectorS.copy( objSphere.position ).multiplyScalar( 2 );
            objSphere.lookAt( vectorS );
            targets.sphere.push(objSphere);

            const vectorH = new THREE.Vector3();
            const hphi = i * 0.175 + Math.PI;
            const objHelix = new THREE.Object3D();
            objHelix.position.x = 900 * Math.sin( hphi );
            objHelix.position.y = - ( i * 8 ) + 450;
            objHelix.position.z = 900 * Math.cos( hphi );
            vectorH.x = objHelix.position.x * 2;
            vectorH.y = objHelix.position.y;
            vectorH.z = objHelix.position.z * 2;
            objHelix.lookAt(vectorH);
            targets.helix.push(objHelix);

            const objGrid = new THREE.Object3D();
            objGrid.position.x = ( ( i % 5 ) * 400 ) - 800;
            objGrid.position.y = ( - ( Math.floor( i / 5 ) % 5 ) * 400 ) + 800;
            objGrid.position.z = ( Math.floor( i / 25 ) ) * 1000 - 2000;
            targets.grid.push(objGrid);
        }
    }

    function transform(target, duration) {
        TWEEN.removeAll();
        for(let i=0;i<objects.length;i++){
            const object = objects[i];
            const t = target[i];
            new TWEEN.Tween(object.position)
            .to({x:t.position.x, y:t.position.y, z:t.position.z}, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
            new TWEEN.Tween(object.rotation)
            .to({ x: t.rotation.x, y: t.rotation.y, z: t.rotation.z}, Math.random()*duration+duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
        }
        new TWEEN.Tween(this)
        .to({}, duration * 2)
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
