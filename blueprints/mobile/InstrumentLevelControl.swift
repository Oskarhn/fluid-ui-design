import SwiftUI

/// A bounded output level in percentage points from 0 through 100.
/// The dial is a visual readout. Slider and buttons provide native operations.
@available(iOS 15.0, *)
struct InstrumentLevelControl: View {
    @Binding var level: Double

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @ScaledMetric(relativeTo: .title) private var dialWidth: CGFloat = 138

    private var fraction: Double {
        min(100, max(0, level)) / 100
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Output")
                .font(.headline)
                .accessibilityHidden(true)

            ZStack {
                Circle()
                    .trim(from: 0, to: 0.75)
                    .stroke(Color.secondary.opacity(0.45), style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(135))
                Circle()
                    .trim(from: 0, to: CGFloat(fraction * 0.75))
                    .stroke(Color.accentColor, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(135))
                Text(fraction, format: .percent.precision(.fractionLength(0)))
                    .font(.title2.weight(.semibold))
                    .monospacedDigit()
            }
            .frame(width: min(dialWidth, 220), height: min(dialWidth, 220))
            .frame(maxWidth: .infinity)
            .accessibilityHidden(true)
            .animation(reduceMotion ? nil : .easeOut(duration: 0.16), value: fraction)

            Slider(value: $level, in: 0...100, step: 1) {
                Text("Output level")
            }
            .frame(minHeight: 44)
            .accessibilityValue(Text(fraction, format: .percent.precision(.fractionLength(0))))

            HStack(spacing: 12) {
                Button {
                    level = max(0, fraction * 100 - 5)
                } label: {
                    Label("Decrease output", systemImage: "minus")
                        .labelStyle(.iconOnly)
                        .frame(minWidth: 44, minHeight: 44)
                        .contentShape(Rectangle())
                }
                .disabled(fraction == 0)

                Button {
                    level = min(100, fraction * 100 + 5)
                } label: {
                    Label("Increase output", systemImage: "plus")
                        .labelStyle(.iconOnly)
                        .frame(minWidth: 44, minHeight: 44)
                        .contentShape(Rectangle())
                }
                .disabled(fraction == 1)
            }
            .buttonStyle(.bordered)
        }
        .padding()
    }
}
