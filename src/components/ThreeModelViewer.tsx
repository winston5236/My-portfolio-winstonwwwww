import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { RotateCw, Box, Eye, RefreshCw } from "lucide-react";

interface ThreeModelViewerProps {
  modelUrl?: string;
  altText?: string;
  accentColor?: string;
}

export const ThreeModelViewer: React.FC<ThreeModelViewerProps> = ({
  modelUrl,
  altText,
  accentColor = "#ffb74d"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [shapeType, setShapeType] = useState<"model" | "torus" | "cube" | "icosahedron">("model");

  const sceneRef = useRef<THREE.Scene | null>(null);
  const loadedObjectRef = useRef<THREE.Object3D | null>(null);
  const materialsRef = useRef<THREE.Material[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#16181d");
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(3, 2, 5);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.5;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(new THREE.Color(accentColor), 1.5);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Grid Floor
    const grid = new THREE.GridHelper(10, 20, 0x3b3f48, 0x24272e);
    grid.position.y = -1.2;
    scene.add(grid);

    // Helper to center and scale loaded object
    const centerAndScale = (obj: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 2.5 / maxDim : 1;
      obj.scale.setScalar(scale);

      // Re-center
      const newBox = new THREE.Box3().setFromObject(obj);
      newBox.getCenter(center);
      obj.position.sub(center);

      // Collect materials
      materialsRef.current = [];
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (Array.isArray(mesh.material)) {
            materialsRef.current.push(...mesh.material);
          } else if (mesh.material) {
            materialsRef.current.push(mesh.material);
          }
        }
      });
    };

    // Load Model or Fallback Geometry
    const load3D = () => {
      setLoading(true);
      setErrorMsg(null);

      // Remove previous object
      if (loadedObjectRef.current) {
        scene.remove(loadedObjectRef.current);
        loadedObjectRef.current = null;
      }

      if (modelUrl && shapeType === "model") {
        const isObj = modelUrl.toLowerCase().endsWith(".obj") || modelUrl.startsWith("data:model/obj") || modelUrl.includes(".obj?");
        const isGltf = modelUrl.toLowerCase().endsWith(".glb") || modelUrl.toLowerCase().endsWith(".gltf") || modelUrl.startsWith("data:model/gltf");

        if (isObj) {
          const loader = new OBJLoader();
          loader.load(
            modelUrl,
            (obj) => {
              centerAndScale(obj);
              scene.add(obj);
              loadedObjectRef.current = obj;
              setLoading(false);
            },
            undefined,
            (err) => {
              console.warn("Failed to load OBJ, switching to parametric 3D object:", err);
              setErrorMsg("Could not load .obj file directly. Showing parametric 3D form.");
              renderParametricFallback("torus");
            }
          );
        } else {
          // GLTF / GLB Loader (or default loader attempt)
          const loader = new GLTFLoader();
          loader.load(
            modelUrl,
            (gltf) => {
              const obj = gltf.scene;
              centerAndScale(obj);
              scene.add(obj);
              loadedObjectRef.current = obj;
              setLoading(false);
            },
            undefined,
            (err) => {
              console.warn("Failed to load GLTF/GLB, switching to 3D fallback:", err);
              setErrorMsg("Model URL unreachable. Showing interactive 3D parametric form.");
              renderParametricFallback("torus");
            }
          );
        }
      } else {
        renderParametricFallback(shapeType === "model" ? "torus" : shapeType);
      }
    };

    const renderParametricFallback = (type: string) => {
      let geometry: THREE.BufferGeometry;
      if (type === "cube") {
        geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8);
      } else if (type === "icosahedron") {
        geometry = new THREE.IcosahedronGeometry(1.5, 1);
      } else {
        geometry = new THREE.TorusKnotGeometry(1.0, 0.3, 128, 32);
      }

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(accentColor),
        roughness: 0.25,
        metalness: 0.65,
        wireframe: wireframe
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      scene.add(mesh);
      loadedObjectRef.current = mesh;
      materialsRef.current = [material];
      setLoading(false);
    };

    load3D();

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, [modelUrl, shapeType, accentColor]);

  // Handle autoRotate state changes
  useEffect(() => {
    if (sceneRef.current) {
      materialsRef.current.forEach((mat) => {
        (mat as THREE.MeshStandardMaterial).wireframe = wireframe;
      });
    }
  }, [wireframe]);

  return (
    <div className="relative w-full h-full min-h-[360px] bg-[#16181d] rounded-md overflow-hidden group">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121316]/80 backdrop-blur-sm z-10 text-xs font-mono text-[var(--muted)]">
          <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[var(--text)]" />
          <span>Rendering 3D viewport...</span>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[#121316]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-[var(--line)] text-xs font-mono">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            autoRotate ? "text-[var(--accent-3d)] bg-white/10" : "text-[var(--muted)] hover:text-white"
          }`}
          title="Toggle Auto Rotate"
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} />
          <span>{autoRotate ? "Rotating" : "Static"}</span>
        </button>

        <button
          onClick={() => setWireframe(!wireframe)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            wireframe ? "text-[var(--accent-3d)] bg-white/10" : "text-[var(--muted)] hover:text-white"
          }`}
          title="Toggle Wireframe"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{wireframe ? "Wireframe" : "Shaded"}</span>
        </button>

        {/* Preset Geometries Selector */}
        <div className="flex items-center gap-1 pl-1 border-l border-[var(--line)]">
          <button
            onClick={() => setShapeType("model")}
            className={`px-2 py-0.5 rounded text-[11px] ${
              shapeType === "model" ? "bg-[var(--surface-2)] text-white" : "text-[var(--muted)] hover:text-white"
            }`}
          >
            Model
          </button>
          <button
            onClick={() => setShapeType("torus")}
            className={`px-2 py-0.5 rounded text-[11px] ${
              shapeType === "torus" ? "bg-[var(--surface-2)] text-white" : "text-[var(--muted)] hover:text-white"
            }`}
          >
            Torus
          </button>
          <button
            onClick={() => setShapeType("cube")}
            className={`px-2 py-0.5 rounded text-[11px] ${
              shapeType === "cube" ? "bg-[var(--surface-2)] text-white" : "text-[var(--muted)] hover:text-white"
            }`}
          >
            Cube
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <div className="absolute bottom-3 left-3 z-10 text-[11px] font-mono text-[var(--muted)] bg-[#121316]/70 px-2.5 py-1 rounded border border-[var(--line)]">
        Left-click drag to orbit • Scroll to zoom • Right-click to pan
      </div>

      {errorMsg && (
        <div className="absolute bottom-3 right-3 z-10 text-[11px] font-mono text-amber-400 bg-[#121316]/90 px-3 py-1 rounded border border-amber-500/30">
          {errorMsg}
        </div>
      )}
    </div>
  );
};
