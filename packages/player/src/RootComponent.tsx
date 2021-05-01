import React, {
	forwardRef,
	Suspense,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import {Internals} from 'remotion';
import {PlayerMethods, PlayerRef} from './player-methods';
import {Controls} from './PlayerControls';
import {usePlayback} from './PlayPause';
import {useHoverState} from './use-hover-state';

const RootComponent: React.ForwardRefRenderFunction<
	PlayerRef,
	{
		controls: boolean;
		style?: Omit<React.CSSProperties, 'width' | 'height'>;
	}
> = ({controls, style}, ref) => {
	const config = Internals.useUnsafeVideoConfig();
	const video = Internals.useVideo();
	const container = useRef<HTMLDivElement>(null);
	const hovered = useHoverState(container);
	const [hasPausedToResume, setHasPausedToResume] = useState(false);
	const player = usePlayback();

	useEffect(() => {
		if (hasPausedToResume && !player.playing) {
			setHasPausedToResume(false);
			player.play();
		}
	}, [hasPausedToResume, player]);

	const toggle = useCallback(() => {
		if (player.playing) {
			player.pause();
		} else {
			player.play();
		}
	}, [player]);

	useImperativeHandle(ref, () => {
		const methods: PlayerMethods = {
			play: player.play,
			pause: player.pause,
			toggle,
			seekTo: (f) => {
				setHasPausedToResume(true);
				player.pause();
				player.seek(f);
			},
		};
		return Object.assign(player.emitter, methods);
	});

	const VideoComponent = video ? video.component : null;

	const containerStyle: React.CSSProperties = useMemo(() => {
		if (!config) {
			return {};
		}
		return {
			position: 'relative',
			width: config.width,
			height: config.height,
			overflow: 'hidden',
			...style,
		};
	}, [config, style]);

	if (!config) {
		return null;
	}

	return (
		<Suspense fallback={<h1>Loading...</h1>}>
			<div ref={container} style={containerStyle}>
				{VideoComponent ? (
					<VideoComponent {...(((video?.props as unknown) as {}) ?? {})} />
				) : null}
				{controls ? (
					<Controls
						fps={config.fps}
						durationInFrames={config.durationInFrames}
						hovered={hovered}
						player={player}
					/>
				) : null}
			</div>
		</Suspense>
	);
};

export default forwardRef(RootComponent);
