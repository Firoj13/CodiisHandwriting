import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot'; // For exporting the canvas as an image
import RNFS from 'react-native-fs'; // For saving SVG data to a file

interface Line {
  id: string;
  data: string;
  color: string;
  thickness: number;
}

const App: React.FC = () => {
  const svgRef = useRef<Svg>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [lineStack, setLineStack] = useState<Line[][]>([]);
  const [undoneLines, setUndoneLines] = useState<Line[][]>([]);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [penColor, setPenColor] = useState('black');
  const [penType, setPenType] = useState(4); // Default pen thickness
  const [canvasWidth, setCanvasWidth] = useState(300); // Set your desired canvas width
  const [canvasHeight, setCanvasHeight] = useState(500); // Set your desired canvas height

  const handleDrawStart = ({ nativeEvent }: any) => {
    const { locationX, locationY } = nativeEvent;
    const lineData = `M${locationX} ${locationY}`;
    const newLine: Line = {
      id: Date.now().toString(),
      data: lineData,
      color: isEraserMode ? 'white' : penColor,
      thickness: penType,
    };
    setLines([...lines, newLine]);
  };

  const handleDrawMove = ({ nativeEvent }: any) => {
    if (lines.length === 0) return;
    const { locationX, locationY } = nativeEvent;
    const lastLine = lines[lines.length - 1];
    const lineData = `${lastLine.data} L${locationX} ${locationY}`;
    const updatedLine = { ...lastLine, data: lineData };
    setLines([...lines.slice(0, -1), updatedLine]);
  };

  const handleDrawEnd = () => {
    if (lines.length > 0) {
      setLineStack([...lineStack, lines]);
      setLines([]);
      setUndoneLines([]); // Clear the undone lines when a new line is drawn
    }
  };

  const handleUndo = () => {
    if (lineStack.length > 0) {
      const lastLine = lineStack[lineStack.length - 1];
      setLineStack(lineStack.slice(0, -1));
      setUndoneLines([...undoneLines, lines]); // Store the undone lines
      setLines(lastLine);
    }
  };

  const handleRedo = () => {
    if (undoneLines.length > 0) {
      const lastUndoneLine = undoneLines[undoneLines.length - 1];
      setUndoneLines(undoneLines.slice(0, -1));
      setLineStack([...lineStack, lines]); // Store the current lines in the lineStack
      setLines(lastUndoneLine);
    }
  };

  const handleEraserToggle = () => {
    setIsEraserMode(!isEraserMode);
  };

  const handlePenColorChange = (color: string) => {
    setPenColor(color);
    setIsEraserMode(false);
  };

  const handlePenTypeChange = (type: number) => {
    setPenType(type);
  };

  const handleExport = async () => {
    try {
      if (svgRef.current) {
        const uri = await captureRef(svgRef.current, {
          format: 'png',
          quality: 1,
        });

        // You can now use the URI to share or save the image
        Alert.alert('Image URI save:', uri)
        // console.log('Image URI:', uri);
      }
    } catch (error) {
      console.error('Error capturing the canvas:', error);
    }
  };

   
  const handleSave = async () => {
    try {
      if (svgRef.current) {
        const uri = await captureRef(svgRef.current, {
          format: 'png', // Capture the canvas as a PNG image
          quality: 1,
        });

        // Get the file path with the .png extension
        const filePath = RNFS.DocumentDirectoryPath + '/canvas.png';

        // Save the image to the file path
        await RNFS.copyFile(uri, filePath);

        console.log('Image saved to:', filePath);
      }
    } catch (error) {
      console.error('Error saving the image:', error);
    }
  };

  const handleClear = () =>{
    setLines([]);
    setLineStack([]);
  }
  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
      <Svg
        ref={svgRef}
        width={canvasWidth}
        height={canvasHeight}
        onTouchStart={handleDrawStart}
        onTouchMove={handleDrawMove}
        onTouchEnd={handleDrawEnd}
        style={styles.canvas}
      >
        {lineStack.map((linesArray) =>
          linesArray.map(({ id, data, color, thickness }) => (
            <Path key={id} d={data} fill="none" stroke={color} strokeWidth={thickness} />
          ))
        )}
        {lines.map(({ id, data, color, thickness }) => (
          <Path key={id} d={data} fill="none" stroke={color} strokeWidth={thickness} />
        ))}
      </Svg>
      </View>
     

      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={handleUndo} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRedo} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>Redo</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleEraserToggle} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>{isEraserMode ? 'Pen' : 'Eraser'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handlePenColorChange('black')} style={[styles.controlButton, styles.blackColorButton]} />
        <TouchableOpacity onPress={() => handlePenColorChange('red')} style={[styles.controlButton, styles.redColorButton]} />
        <TouchableOpacity onPress={() => handlePenColorChange('blue')} style={[styles.controlButton, styles.blueColorButton]} />
        {/* Add more color options as needed */}

        <Text style={styles.text}>Pen Type :</Text>
        <TouchableOpacity onPress={() => handlePenTypeChange(2)} style={[styles.controlButton, styles.thinPenButton]} />
        <TouchableOpacity onPress={() => handlePenTypeChange(4)} style={[styles.controlButton, styles.mediumPenButton]} />
        <TouchableOpacity onPress={() => handlePenTypeChange(6)} style={[styles.controlButton, styles.thickPenButton]} />

        {/* Add more pen type options as needed */}
        <TouchableOpacity onPress={handleExport} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>Export</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSave} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>Save</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClear} style={styles.controlButton}>
          <Text style={styles.controlButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f3f3',
  },
  canvas: {
    borderWidth: 1,
    borderColor: 'gray',
  },
  controlsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  controlButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  blackColorButton: {
    backgroundColor: 'black',
  },
  redColorButton: {
    backgroundColor: 'red',
  },
  blueColorButton: {
    backgroundColor: 'blue',
  },
  thinPenButton: {
    backgroundColor: 'gray',
    width: 50,
    height: 30,
  },
  mediumPenButton: {
    backgroundColor: 'gray',
    width: 70,
    height: 40,
  },
  thickPenButton: {
    backgroundColor: 'gray',
    width: 90,
    height: 50,
  },
  canvasContainer: {
    height:500,
    backgroundColor:"#ffffff"
  },
  text:
  {fontSize:18, color:'#000000',fontWeight:'500'}
});

export default App;
