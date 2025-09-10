import { DualRangeSlider } from '@/components/DualRangeSlider'

export default function SliderTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Custom Dual Range Slider Test
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Dual Value Range Slider (0-10, 0.1 steps)
          </h2>
          
          <div className="space-y-8">
            <DualRangeSlider />
          </div>
        </div>
      </div>
    </div>
  )
}