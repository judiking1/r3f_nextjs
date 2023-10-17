import React, { useEffect, useRef, useState } from 'react'
import { Camera, Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three';

const Rail: React.FC = () => {
    return (
        <mesh>
            <torusGeometry args={[5, 0.2, 8, 100]} />
            <meshBasicMaterial color="grey" />
        </mesh>
    )
}

const Train: React.FC<{ id: number; color: string }> = ({ id, color }) => {
    const ref = useRef<THREE.Mesh>(null!);
    const angle = useRef(0);

    useFrame(() => {
        if (ref.current) {
            angle.current += 0.005 * (id + 0.5);  // 각 기차마다 다른 속도를 줍니다.
            ref.current.position.x = 5 * Math.cos(angle.current);
            ref.current.position.y = 5 * Math.sin(angle.current);
        }
    });

    return (
        <mesh ref={ref} name={`train-${id}`}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshBasicMaterial color={color} />
        </mesh>
    );
};

const CameraController = ({ focusedTrain }: { focusedTrain: number | null }) => {
    const { camera, scene } = useThree();
    const target = new THREE.Vector3();
    const distanceToTrain = useRef(8); // 초기 카메라와 기차 사이의 거리
    const initialCameraPosition = useRef(new THREE.Vector3(0, 0, 20)); // 초기 카메라 위치
    const animateCameraPosition = (from: THREE.Vector3, to: THREE.Vector3, duration: number, camera: Camera ) => {
        const start = performance.now();
        
        const animate = (time: number) => {
          const elapsed = time - start;
          const t = Math.min(elapsed / duration, 1);
          
          const x = from.x + t * (to.x - from.x);
          const y = from.y + t * (to.y - from.y);
          const z = from.z + t * (to.z - from.z);
          
          camera.position.set(x, y, z);
          camera.lookAt(target);
          
          if (t < 1) requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
      };
    useFrame(() => {
        let train;
        if (focusedTrain !== null) {
            train = scene.getObjectByName(`train-${focusedTrain}`);
        }
        if (train) {
            // 기차에 포커스
            target.copy(train.position);
        } else {
            // 레일에 포커스 (기본 위치)
            target.set(0, 0, 0);
        }
        const currentPosition = initialCameraPosition.current.clone();
        currentPosition.lerp(target, 0.01);
        currentPosition.sub(target).setLength(distanceToTrain.current);
        currentPosition.add(target);
        camera.position.copy(currentPosition);
        camera.lookAt(target);
        animateCameraPosition(currentPosition, target, 1000, camera);
    });
    

    useEffect(() => {
        const handleZoomIn = () => distanceToTrain.current = 4;
        const handleZoomOut = () => {
            if (focusedTrain !== null) {
                // 기차가 선택되어 있을 경우 더 멀리 보게 설정
                distanceToTrain.current = 10;
            } else {
                // 기본 화면일 경우 초기 설정으로
                distanceToTrain.current = 8;
            }
        };

        window.addEventListener('zoomIn', handleZoomIn);
        window.addEventListener('zoomOut', handleZoomOut);

        return () => {
            window.removeEventListener('zoomIn', handleZoomIn);
            window.removeEventListener('zoomOut', handleZoomOut);
        };
    }, []);

    return null;
};

// 랜덤 색상을 생성하는 함수
const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

export default function MyElement3D() {
    const [focusedTrain, setFocusedTrain] = useState<number | null>(null);
    const [trainColors, setTrainColors] = useState<string[]>([]);
    useEffect(() => {
        const initialColors = Array.from({ length: 10 }, () => getRandomColor());
        setTrainColors(initialColors);
    }, []);
    return (
        <>
            <button onClick={() => window.dispatchEvent(new Event('zoomIn'))}>Zoom In</button>
            <button onClick={() => window.dispatchEvent(new Event('zoomOut'))}>Zoom Out</button>
            <button onClick={() => setFocusedTrain(null)}>Reset View</button>
            {Array.from({ length: 10 }, (_, i) => (
                <button key={i} onClick={() => setFocusedTrain(i)} style={{
                    backgroundColor: trainColors[i],
                    color: '#fff'
                }}>
                    Focus on Train {i}
                </button>
            ))}
            <Canvas camera={{ position: [0, 5, 10] }} style={{ width: '800px', height: '600px', margin: '100px auto', backgroundColor: '#eee' }}>
                <CameraController focusedTrain={focusedTrain} />
                <OrbitControls />
                <Rail />
                {Array.from({ length: 10 }, (_, i) => (
                    <Train key={i} id={i} color={trainColors[i]} />
                ))}
            </Canvas>
        </>
    )
}
