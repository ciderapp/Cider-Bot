use std::error::Error;
use vergen::EmitBuilder;

fn main() -> Result<(), Box<dyn Error>> {
    // Emit the instructions
    EmitBuilder::builder().all_git().emit_and_set()?;
    EmitBuilder::builder().all_build().emit_and_set()?;
    EmitBuilder::builder().all_rustc().emit_and_set()?;
    EmitBuilder::builder().all_cargo().emit_and_set()?;
    EmitBuilder::builder().all_sysinfo().emit_and_set()?;
    Ok(())
}
